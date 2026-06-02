import amqp from "amqplib";
import config from "./index.js";
import logger from "./logger.js";

/**
 * A class to manage RabbitMQ connection using amqplib.
 */
class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnecting = false;
    }

    /**
     * Connect to RabbitMQ using amqplib. If a connection already exists, it returns the existing channel.
     * @returns {Promise<import("amqplib").Channel>} The RabbitMQ channel for publishing messages.
     */
    async connect() {
        if (this.connection) {
            return this.connection;
        }
        if (this.isConnecting) {
            await new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.isConnecting) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            return this.channel;
        }

        try {
            this.isConnecting = true;

            // Attempt to connect to RabbitMQ
            logger.info(`Connecting to RabbitMQ at ${config.rabbitmq.url}...`);
            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            //Dead Letter Queue setup
            const dlqName = `${config.rabbitmq.queue}.dlq`;
            await this.channel.assertQueue(dlqName, {
                durable: true,
            });

            // Main queue setup with DLQ configuration
            await this.channel.assertQueue(config.rabbitmq.queue, {
                durable: true,
                arguments: {
                    "x-dead-letter-exchange": "",
                    "x-dead-letter-routing-key": dlqName,
                },
            });

            logger.info("RabbitMQ connected, queue:", config.rabbitmq.queue);

            // Handle connection close and errors
            this.connection.on("close", () => {
                logger.warn("RabbitMQ connection closed");
                this.connection = null;
                this.channel = null;
            });
            this.connection.on("error", (err) => {
                logger.error("RabbitMQ connection error: %s", err);
                this.connection = null;
                this.channel = null;
            });

            this.isConnecting = false;
            return this.channel;
        } catch (error) {
            this.isConnecting = false;
            logger.error("Failed to connect to RabbitMQ", error);
            throw error;
        }
    }

    /**
     * Get the RabbitMQ channel. Throws an error if the channel is not established.
     * @returns {import("amqplib").Channel}
     */
    getChannel() {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not established");
        }
        return this.channel;
    }

    /**
     * Get the status of the RabbitMQ connection.
     * @returns {"connected" | "disconnected" | "closing"}
     */
    getstatus() {
        if (!this.connect || !this.channel) return "disconnected";
        if (this.connect.closing) return "closing";
        return "connected";
    }

    /**
     * Close the RabbitMQ connection and channel gracefully.
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            logger.info("RabbitMQ connection closed");
        } catch (error) {
            logger.error("Failed to close RabbitMQ connection:", error);
            throw error;
        }
    }
}

export default new RabbitMQConnection();
