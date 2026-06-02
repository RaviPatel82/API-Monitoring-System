import dotenv from "dotenv";

dotenv.config();

const config = {
    //server
    node_env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,

    //MongoDB
    mongo: {
        uri:
            process.env.MONGO_URI || "mongodb://localhost:27017/api-monitoring",
        dbName: process.env.MONGO_DB_NAME || "api-monitoring",
    },

    //PostgreSQL
    postgres: {
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || 5432,
        database: process.env.PG_DATABASE || "api_monitoring",
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
    },

    //RabbitMQ
    rabbitmq: {
        url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
        queue: process.env.RABBITMQ_QUEUE || "api_hits",
        publisherConfirms:
            process.env.RABBITMQ_PUBLISHER_CONFIRMS === "true" || false,
        retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || "3", 10),
        retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || "1000", 10),
    },
    
    //jwt
    jwt: {
        secret: process.env.JWT_SECRET || "your_jwt_secret",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    },

    //Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minute
        max: parseInt(process.env.RATE_LIMIT_MAX || "1000", 10), // limit each IP to 1000 requests per windowMs
    },

    
};

export default config;
