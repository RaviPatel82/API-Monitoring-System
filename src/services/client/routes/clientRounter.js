import express from "express";
import clientDepencies from "../Dependencies/dependencies.js";
import authenticate from "../../../shared/middlewares/authenticate.js";

const router = express.Router();
const { clientController } = clientDepencies.controller;

router.use(authenticate);

// onboard a new client
router.post("/admin/clients/onboard", (req, res, next) =>
    clientController.createClient(req, res, next),
);

// create a new user for a client
router.post("/admin/clients/:clientId/user", (req, res, next) =>
    clientController.createClientUser(req, res, next),
);

// generate a new API key for a client
router.post("/admin/clients/:clientId/api-key", (req, res, next) =>
    clientController.createApiKey(req, res, next),
);

// get all API keys for a client
router.get("/admin/clients/:clientId/api-key", (req, res, next) =>
    clientController.getClientApiKeys(req, res, next),
);

export default router;
