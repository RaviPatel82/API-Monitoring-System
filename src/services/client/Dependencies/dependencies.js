import MongoClientRepository from "../repository/ClientRepository.js";
import MongoApiKeyRepository from "../repository/ApiKeyRepository.js";
import MongoUserRepository from "../../auth/repository/UserRepository.js";
import { ClientService } from "../service/clientService.js";
import { ClientController } from "../controller/clientController.js";
import authContainer from "../../auth/Dependencies/dependencies.js";
class container {
    static init() {
        const repositories = {
            clientRepository: MongoClientRepository,
            apiKeyRepository: MongoApiKeyRepository,
            userRepository: MongoUserRepository,
        };
        const services = {
            clientService: new ClientService({
                clientRepository: repositories.clientRepository,
                apiKeyRepository: repositories.apiKeyRepository,
                userRepository: repositories.userRepository,
            }),
        };
        const controller = {
            clientController: new ClientController(
                services.clientService,
                authContainer.services.authService,
            ),
        };
        return {
            repositories,
            services,
            controller,
        };
    }
}
const initialized = container.init();
export { container };
export default initialized;
