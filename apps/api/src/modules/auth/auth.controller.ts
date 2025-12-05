import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-pin')
  verifyPin(@Body('pin') pin: string) {
    const isValid = this.authService.verifyPin(pin);
    if (!isValid) {
      throw new UnauthorizedException('PIN inválido');
    }
    return { success: true };
  }
}
