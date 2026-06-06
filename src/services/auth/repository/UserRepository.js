import BaseRepository from "../repository/BaseRepository.js";
import User from "../../../shared/models/User.js";
import logger from "../../../shared/config/logger.js";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";
/**
 * Mongoose implementation of the UserRepository interface.
 * This class provides methods to interact with the User collection in MongoDB using Mongoose.
 */
class MongoUserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async create(userData) {
        try {
            let data = { ...userData };
            if (
                data.role === APPLICATION_ROLES.SUPER_ADMIN &&
                !data.permissions
            ) {
                data.permissions = {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true,
                };
            }
            const user = new this.model(data);
            await user.save();

            logger.info(
                `User created : ${user.username} with role ${user.role}`,
            );
            return user;
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    async findById(id) {
        try {
            const user = await this.model.findById(id);
            return user;
        } catch (error) {
            logger.error(`Error finding user by ID: ${error.message}`);
            throw error;
        }
    }

    async findByUsername(username) {
        try {
            const user = await this.model.findOne({ username });
            return user;
        } catch (error) {
            logger.error(`Error finding user by username: ${error.message}`);
            throw error;
        }
    }

    async findByEmail(email) {
        try {
            const user = await this.model.findOne({ email });
            return user;
        } catch (error) {
            logger.error(`Error finding user by email: ${error.message}`);
            throw error;
        }
    }

    async findAll() {
        try {
            const users = await this.model
                .find({ isActive: true })
                .select("-password");
            return users;
        } catch (error) {
            logger.error(`Error finding all users: ${error.message}`);
            throw error;
        }
    }
}
export default new MongoUserRepository();
