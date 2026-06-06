import Client from "../../../shared/models/Client.js";
import BaseClientRepository from "./BaseClientRepository.js";
import logger from "../../../shared/config/logger.js";

class MongoClientRepository extends BaseClientRepository {
    constructor() {
        super(Client);
    }
    async create(clientData) {
        try {
            const client = new this.model(clientData);
            await client.save();
            logger.info(`Client created:`, {
                clientId: client._id,
                slug: client.slug,
            });
            return client;
        } catch (error) {
            logger.error(`Error creating client:`, error);
            throw error;
        }
    }

    async findById(clientId) {
        try {
            const client = this.model.findById(clientId);

            logger.info(`Client details from mongoDb:`, client);
            return client;
        } catch (error) {
            logger.error(`Error finding client by ID:`, error);
            throw error;
        }
    }

    async findBySlug(slug) {
        try {
            const client = this.model.findOne({ slug });
            logger.info(`Client details from mongoDb:`, client);
            return client;
        } catch (error) {
            logger.error(`Error finding client by slug:`, error);
            throw error;
        }
    }

    async find(filters = {}, options = {}) {
        try {
            const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
            const clients = await this.model
                .find(filters)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select("-__v");
            logger.info(`Clients details from mongoDb:`, clients);
            return clients;
        } catch (error) {
            logger.error(`Error finding clients:`, error);
            throw error;
        }
    }

    async count(filters = {}) {
        try {
            const count = await this.model.countDocuments(filters);
            logger.info(`Total clients in mongoDb: ${count} clients`);
            return count;
        } catch (error) {
            logger.error(`Error counting clients:`, error);
            throw error;
        }
    }
}

export default new MongoClientRepository();
