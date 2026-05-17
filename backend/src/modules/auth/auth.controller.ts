import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import type { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto'
import { CurrentUser } from '../../common/current-user.decorator'
import type { JwtUser, JwtRefreshUser } from '../../common/current-user.decorator'

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
  refresh(@CurrentUser() user: JwtRefreshUser): Promise<TokenPairDto> {
    return this.authService.refresh(user.userId, user.refreshToken)
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async logout(@CurrentUser() user: JwtUser): Promise<void> {
    await this.authService.logout(user.userId)
  }
}
