import "./crypto-polyfill.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./shared/config/index.js";
import logger from "./shared/config/logger.js";
import mongodb from "./shared/config/mongodb.js";
import postgres from "./shared/config/postgres.js";
import rabbitmqC from "./shared/config/rabbitmq.js";
import errorHandler from "./shared/middlewares/errorHandler.js";
import ResponseFormatter from "./shared/utils/responseFormatter.js";
import cookieParser from "cookie-parser";

// Import routes
import authRouter from "./services/auth/routes/authRouter.js";
import clientRouter from "./services/client/routes/clientRounter.js";
import ingestRouter from "./services/ingest/routes/ingestRoutes.js";
import analyticsRouter from "./services/analytics/routes/analyticsRoutes.js";

// Initialize Express app
const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
/**
 * Request logging middleware
 * Logs the HTTP method, path, IP address, and user agent for each incoming request.
 **/
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.header["User-Agent"],
    });
    next();
});

/**
 * Health check endpoint
 * Used to verify that the server is running and responsive.
 **/
app.get("/health", (req, res) => {
    res.status(200).json(
        ResponseFormatter.success(
            {
                status: "healthy",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            },
            "Server is healthy",
        ),
    );
});

/**
 * Root endpoint
 * Provides basic information about the API service and available endpoints.
 **/
app.get("/", (req, res) => {
    res.status(200).json(
        ResponseFormatter.success(
            {
                service: "API Hit Monitoring System",
                version: "1.0.0",
                endpoints: {
                    health: "/health",
                    auth: "/api/auth",
                    ingest: "/api/hit",
                    analytics: "/api/analytics",
                },
            },
            "API Hit Monitoring Service",
        ),
    );
});

/**
 * API Routes
 */
app.use("/api/auth", authRouter);
app.use("/api/hit", ingestRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api", clientRouter);

/**
 * 404 Handler
 */
app.use((req, res) => {
    res.status(404).json(ResponseFormatter.error("Endpoint not found", 404));
});

app.use(errorHandler);

async function initializeConnection() {
    try {
        logger.info(
            "Initializing connections to MongoDB, PostgreSQL, and RabbitMQ...",
        );

        // Connect to MongoDB
        await mongodb.connect();

        // Connect to PostgreSQL
        await postgres.testConnection();

        // Connect to RabbitMQ
        await rabbitmqC.connect();

        logger.info("All connections initialized successfully");
    } catch (error) {
        logger.error("Failed to initialize connections", error);
        throw error;
    }
}

async function startServer() {
    try {
        await initializeConnection();

        const server = app.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port}`);
            logger.info(`Environment: ${config.node_env}`);
            logger.info(`API available at: http://localhost:${config.port}`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received, shutting down gracefully...`);

            // Stop accepting new requests and close the server
            server.close(async () => {
                logger.info("HTTP server closed");
                try {
                    await mongodb.disconnect();
                    await postgres.close();
                    await rabbitmqC.close();
                    logger.info("All connections closed, exiting process");
                    process.exit(0);
                } catch (error) {
                    logger.error("Error during shutdown:", error);
                    process.exit(1);
                }
            });

            // Force shutdown if graceful shutdown takes too long
            setTimeout(() => {
                logger.error("Forced shutdown");
                process.exit(1);
            }, 10000);
        };

        // Handle termination signals
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        // Handle SIGTERM signal
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        // Handle uncaught exceptions
        process.on("uncaughtException", (error) => {
            logger.error("Uncaught Exception:", error);
            gracefulShutdown("uncaughtException");
        });
        // Handle unhandled promise rejections
        process.on("unhandledRejection", (reason, promise) => {
            logger.error("Unhandled Rejection at:", promise, "reason:", reason);
            gracefulShutdown("unhandledRejection");
        });
    } catch (error) {
        logger.error("Failed to start server", error);
        throw error;
    }
}

startServer();
