import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  verifyPin(pin: string): boolean {
    const validPin = this.configService.get<string>('PIN_CODE');
    return pin === validPin;
  }
}
