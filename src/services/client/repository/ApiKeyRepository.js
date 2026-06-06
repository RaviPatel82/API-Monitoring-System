import BaseApiKeyRepository from "./BaseApiKeyRepository.js";
import ApiKey from "../../../shared/models/ApiKey.js";
import logger from "../../../shared/config/logger.js";

class MongoApiKeyRepository extends BaseApiKeyRepository {
    constructor() {
        super(ApiKey);
    }
    async create(apiKeyData) {
        try {
            const apiKey = new this.model(apiKeyData);
            await apiKey.save();
            logger.info(`ApiKey created:`, { keyId: apiKey.keyId });
            return apiKey;
        } catch (error) {
            logger.error(`Error creating api key:`, error);
            throw error;
        }
    }

    async findByClientId(clientId, filters = {}) {
        try {
            const query = { ...filters, clientId };
            const apiKeys = await this.model
                .find(query)
                .populate("createdBy", "username email")
                .sort({ createdAt: -1 });
            logger.info(`ApiKeys details from mongoDb:`, apiKeys);
            return apiKeys;
        } catch (error) {
            logger.error(`Error finding api keys by client ID:`, error);
            throw error;
        }
    }

    async findByKeyValue(keyValue, includeInactive = false) {
        try {
            const filter = { keyValue };
            if (!includeInactive) {
                filter.isActive = true;
            }

            const apiKey = await this.model
                .findOne(filter)
                .populate("clientId");
            return apiKey;
        } catch (error) {
            logger.error("Error finding API key by value:", error);
            throw error;
        }
    }
    async countByClientId(clientId, filters = {}) {
        try {
            const count = await this.model.countDocuments({
                ...filters,
                clientId,
            });
            logger.info(`Total api keys in mongoDb: ${count} api keys`);
            return count;
        } catch (error) {
            logger.error(`Error counting api keys by client ID:`, error);
            throw error;
        }
    }
}

export default new MongoApiKeyRepository();
