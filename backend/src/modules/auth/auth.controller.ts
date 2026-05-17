import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import type { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto'

interface JwtUser {
  userId: string
  email: string
}

interface JwtRefreshUser extends JwtUser {
  refreshToken: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto)
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@Req() req: Request): Promise<TokenPairDto> {
    const { userId, refreshToken } = req.user as JwtRefreshUser
    return this.authService.refresh(userId, refreshToken)
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request): Promise<void> {
    const { userId } = req.user as JwtUser
    await this.authService.logout(userId)
  }
}
