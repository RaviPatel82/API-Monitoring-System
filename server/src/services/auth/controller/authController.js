import { APPLICATION_ROLES } from "../../../shared/constants/roles.js";
import config from "../../../shared/config/index.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

export class AuthController {
    constructor(authService) {
        if (!authService) {
            throw new Error("AuthService is required");
        }
        this.authService = authService;
    }

    async onboardSuperAdmin(req, res, next) {
        try {
            const { email, username, password } = req.body;
            const superAdminData = {
                email,
                username,
                password,
                role: APPLICATION_ROLES.SUPER_ADMIN,
            };
            const { user, token } =
                await this.authService.onboardSuperAdmin(superAdminData);
            res.cookie("authToken", token, {
                httpOnly: config.cookies.httpOnly,
                secure: config.cookies.secure,
                sameSite: config.cookies.sameSite,
                maxAge: config.cookies.expiresIn,
            });
            res.status(201).json(
                ResponseFormatter.success(
                    user,
                    "Super admin onboarded successfully",
                    201,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const { username, email, password, role } = req.body;
            const userData = {
                username,
                email,
                password,
                role: role || APPLICATION_ROLES.CLIENT_VIEWER,
            };

            const { user, token } = await this.authService.register(userData);
            res.cookie("authToken", token, {
                httpOnly: config.cookies.httpOnly,
                secure: config.cookies.secure,
                sameSite: config.cookies.sameSite,
                maxAge: config.cookies.expiresIn,
            });
            res.status(201).json(
                ResponseFormatter.success(
                    user,
                    "User created successfully",
                    201,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const userData = {
                username,
                password,
            };

            const { user, token } = await this.authService.login(userData);

            res.cookie("authToken", token, {
                httpOnly: config.cookies.httpOnly,
                secure: config.cookies.secure,
                sameSite: config.cookies.sameSite,
                maxAge: config.cookies.expiresIn,
            });

            res.status(200).json(
                ResponseFormatter.success(
                    user,
                    "User LoggedIn successfully",
                    200,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;

            const result = await this.authService.getProfile(userId);

            res.status(200).json(
                ResponseFormatter.success(
                    result,
                    "Profile fetched successfully",
                    200,
                ),
            );
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            res.clearCookie("authToken", {
                httpOnly: config.cookies.httpOnly,
                secure: config.cookies.secure,
                sameSite: config.cookies.sameSite,
            });
            res.status(200).json(
                ResponseFormatter.success({}, "Logout successful", 200),
            );
        } catch (error) {
            next(error);
        }
    }
}
