import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto'
import { CurrentUser } from '../../common/current-user.decorator'
import type { JwtUser, JwtRefreshUser } from '../../common/current-user.decorator'

/**
 * REST controller for authentication (register, login, refresh, logout).
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user and issues access/refresh tokens.
   *
   * @param dto - Registration payload: email, name, password.
   * @returns AuthResponse containing user data and tokens.
   */
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'User registered successfully.', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto)
  }

  /**
   * Authenticates a user and issues access/refresh tokens.
   *
   * @param dto - Login payload: email, password.
   * @returns AuthResponse containing user data and tokens.
   */
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Logged in successfully.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto)
  }

  /**
   * Refreshes the access token using a valid refresh token.
   *
   * @param user - Populated from the jwt-refresh guard.
   * @returns New TokenPair.
   */
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Tokens refreshed.', type: TokenPairDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  @Post('refresh')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@CurrentUser() user: JwtRefreshUser): Promise<TokenPairDto> {
    return this.authService.refresh(user.userId, user.refreshToken)
  }

  /**
   * Invalidates the current refresh token and logs the user out.
   *
   * @param user - Populated from the jwt guard.
   * @returns void — HTTP 204 No Content.
   */
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async logout(@CurrentUser() user: JwtUser): Promise<void> {
    await this.authService.logout(user.userId)
  }
}
