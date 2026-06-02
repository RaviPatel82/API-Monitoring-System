import pg from "pg";
import config from "./index.js";
import logger from "./logger.js";

const { Pool } = pg;

/**
 * A class to manage PostgreSQL connection using pg Pool.
 */

class PostgresConnection {
    constructor() {
        this.pool = null;
    }

    /**
     * Gets the PostgreSQL connection pool.
     * @returns {Pool} The PostgreSQL connection pool.
     */
    getPool() {
        if (!this.pool) {
            this.pool = new Pool({
                host: config.postgres.host,
                port: config.postgres.port,
                database: config.postgres.database,
                user: config.postgres.user,
                password: config.postgres.password,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
            this.pool.on("error", (err) => {
                logger.error("Unexpected error on idle PG client", err);
            });

            logger.info("PG Pool Created");
        }
        return this.pool;
    }

    /**
     * Tests the PostgreSQL connection by executing a simple query.
     * @returns {Promise<void>}
     */
    async testConnection() {
        const pool = this.getPool();
        try {
            const client = await pool.connect();
            const res = await client.query("SELECT NOW()");
            client.release();

            logger.info(`PG connected successfully at ${res.rows[0].now}`);
        } catch (error) {
            logger.error("Failed to connect to PostgreSQL:", error);
            throw error;
        }
    }

    /**
     * Executes a PostgreSQL query.
     * @param {string} text - The SQL query text.
     * @param {Array} params - The query parameters.
     * @returns {Promise} A promise resolving to the query result.
     */
    async query(text, params) {
        const pool = this.getPool();
        try {
            const res = await pool.query(text, params);
            logger.debug("Executed query", {
                text,
                rows: res.rowCount,
            });
            return res;
        } catch (error) {
            logger.error("Query error:", { text, error: error.message });
            throw error;
        }
    }

    /**
     * Closes the PostgreSQL connection pool.
     * @returns {Promise<void>}
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger.info("PG Pool closed");
        }
    }
}

export default new PostgresConnection();
