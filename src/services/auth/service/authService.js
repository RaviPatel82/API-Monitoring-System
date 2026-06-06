import logger from "../../../shared/config/logger.js";
import jwt from "jsonwebtoken";
import config from "../../../shared/config/index.js";
import AppError from "../../../shared/utils/AppError.js";
import bcrypt from "bcryptjs";
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";

export class AuthService {
    constructor(userRepository) {
        if (!userRepository) {
            throw new Error("UserRepository is required");
        }
        this.userRepository = userRepository;
    }

    generateToken(user) {
        const { _id, email, username, role, clientId } = user;

        const payload = {
            userId: _id,
            username,
            email,
            role,
            clientId,
        };

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    async comparePassword(userEnteredPassword, hashedPassword) {
        return await bcrypt.compare(userEnteredPassword, hashedPassword);
    }

    formatUserForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user };
        delete userObj.password;
        return userObj;
    }

    async onboardSuperAdmin(superAdminData) {
        // Implementation for onboarding super admin
        try {
            const existingUser = await this.userRepository.findAll();
            if (existingUser && existingUser.length > 0) {
                throw new AppError("Super admin already exists", 403);
            }
            const user = await this.userRepository.create(superAdminData);
            const token = this.generateToken(user);
            logger.info(
                `Super admin onboarded: ${user.username} with role ${user.role}`,
            );
            return { user: this.formatUserForResponse(user), token };
        } catch (error) {
            logger.error(`Error onboarding super admin: `, error);
            throw error;
        }
    }
    async register(userData) {
        try {
            const existingUser = await this.userRepository.findByUsername(
                userData.username,
            );
            if (existingUser) {
                throw new AppError("Username already exists", 409);
            }
            const existingEmail = await this.userRepository.findByEmail(
                userData.email,
            );
            if (existingUser) {
                throw new AppError("Email already exists", 409);
            }
            const user = await this.userRepository.create(userData);
            const token = this.generateToken(user);
            logger.info(`User: ${user.username} with role ${user.role}`);
            return { user: this.formatUserForResponse(user), token };
        } catch (error) {
            logger.error(`Error in Registion service: `, error);
            throw error;
        }
    }

    async login(userData) {
        try {
            const user = await this.userRepository.findByUsername(
                userData.username,
            );
            if (!user) {
                throw new AppError("Invliad Credentials", 401);
            }
            if (!user.isActive) {
                throw new AppError("Account is deactivated", 403);
            }
            const isPasswordValid = await this.comparePassword(
                userData.password,
                user.password,
            );
            if (!isPasswordValid) {
                throw new AppError("Invliad Credentials", 401);
            }
            const token = this.generateToken(user);

            logger.info("User loggedIn successfully", {
                username: user.username,
            });

            return {
                user: this.formatUserForResponse(user),
                token,
            };
        } catch (error) {
            logger.error("Error in Login service", error);
            throw error;
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                throw new AppError("User not found", 404);
            }
            return this.formatUserForResponse(user);
        } catch (error) {
            logger.error("Error getting user profile:", error);
            throw error;
        }
    }

    async checkSuperAdminPermissions(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }

            return user.role === APPLICATION_ROLES.SUPER_ADMIN;
        } catch (error) {}
    }
}
