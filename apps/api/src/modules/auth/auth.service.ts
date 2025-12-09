import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private configService: ConfigService) {}

  verifyPin(pin: string): boolean {
    const validPin = this.configService.get<string>("PIN_CODE");
    this.logger.log(`PIN recebido: "${pin}", PIN válido: "${validPin}"`);
    const isValid = pin === validPin;
    this.logger.log(`Resultado: ${isValid}`);
    return isValid;
  }
}
