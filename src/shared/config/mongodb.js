import config from "./index.js";
import mongoose from "mongoose";
import logger from "./logger.js";

/**
 * A class to manage MongoDB connection using Mongoose.
 */

class MongoConnection {
    constructor() {
        this.Connection = null;
    }

    /**
     * Connect to MongoDB using Mongoose. If a connection already exists, it returns the existing connection.
     * @returns {Promise<mongoose.Connection>}
     */
    async connect() {
        try {
            // Check if connection already exists
            if (this.Connection) {
                return this.Connection;
                logger.info("MongoDB connection already established");
            }
            // Create new connection
            this.Connection = await mongoose.connect(config.mongo.uri, {
                dbName: config.mongo.dbName,
            });
            logger.info(`Connected to MongoDB at ${config.mongo.uri}`);

            // Handle connection events
            this.Connection.connection.on("error", (err) => {
                logger.error("MongoDB connection error: %s", err);
            });
            this.Connection.connection.on("disconnected", () => {
                logger.warn("MongoDB connection disconnected");
            });

            return this.Connection;
        } catch (error) {
            logger.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB
     * @returns{Promise<void>}
     */
    async disconnect() {
        try {
            if (this.Connection) {
                await mongoose.disconnect();
                this.Connection = null;
                logger.info("MongoDB connection closed");
            }
        } catch (error) {
            logger.error("Failed to disconnect from MongoDB:", error);
            throw error;
        }
    }

    /**
     * Get the active connection
     * @returns{mongoose.connection}
     */
    getConnection() {
        if (!this.Connection) {
            throw new Error("MongoDB connection not established");
        }
        return this.Connection;
    }
}

export default new MongoConnection();
