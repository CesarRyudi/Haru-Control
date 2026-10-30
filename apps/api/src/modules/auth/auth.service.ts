import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private configService: ConfigService) {}

  verifyPin(pin: string): boolean {
    this.logger.debug("Tentativa de validação de PIN recebida");
    const validPin = this.configService.get<string>("PIN_CODE");
    const isValid = pin === validPin;
    return isValid;
  }
}
