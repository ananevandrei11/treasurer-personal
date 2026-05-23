import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { createHash, timingSafeEqual } from 'crypto'
import type { User } from '@prisma/client'
import type { RegisterDto } from './dto/register.dto'
import type { LoginDto } from './dto/login.dto'
import type { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto'
import { CreateUserCommand } from '../users/commands/create-user.command'
import { UpdateRefreshTokenHashCommand } from '../users/commands/update-refresh-token-hash.command'
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query'
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query'
import { UserDto } from '../users/dto/user.dto'

interface JwtPayload {
  sub: string
  email: string
}

/**
 * Application service for Authentication.
 * Handles registration, login, token refresh, and logout.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Registers a new user and issues tokens.
   *
   * @param dto - Validated registration data.
   * @returns AuthResponse containing the new user and tokens.
   * @throws {ConflictException} If the email is already registered.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
      new GetUserByEmailQuery(dto.email),
    )
    if (existing) throw new ConflictException('Email already in use')

    const user = await this.commandBus.execute<CreateUserCommand, User>(
      new CreateUserCommand(dto.email, dto.name, dto.password),
    )

    const tokens = await this.issueTokens(user)
    await this.commandBus.execute(new UpdateRefreshTokenHashCommand(user.id, tokens.refreshToken))

    return { user: UserDto.fromEntity(user), ...tokens }
  }

  /**
   * Validates user credentials and issues tokens.
   *
   * @param dto - Validated login data.
   * @returns AuthResponse containing the user and tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.queryBus.execute<GetUserByEmailQuery, User | null>(
      new GetUserByEmailQuery(dto.email),
    )
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.issueTokens(user)
    await this.commandBus.execute(new UpdateRefreshTokenHashCommand(user.id, tokens.refreshToken))

    return { user: UserDto.fromEntity(user), ...tokens }
  }

  /**
   * Refreshes access and refresh tokens.
   *
   * @param userId - User UUID.
   * @param refreshToken - Raw refresh token to validate.
   * @returns New TokenPair.
   * @throws {UnauthorizedException} If the refresh token is invalid or user not found.
   */
  async refresh(userId: string, refreshToken: string): Promise<TokenPairDto> {
    const user = await this.queryBus.execute<GetUserByIdQuery, User | null>(
      new GetUserByIdQuery(userId),
    )
    if (!user?.refreshTokenHash) throw new UnauthorizedException('Access denied')

    const incomingHash = createHash('sha256').update(refreshToken).digest('hex')
    const incomingBuf = Buffer.from(incomingHash, 'utf8')
    const storedBuf = Buffer.from(user.refreshTokenHash, 'utf8')
    if (
      incomingBuf.length !== storedBuf.length ||
      !timingSafeEqual(new Uint8Array(incomingBuf), new Uint8Array(storedBuf))
    ) {
      throw new UnauthorizedException('Access denied')
    }

    const tokens = await this.issueTokens(user)
    await this.commandBus.execute(new UpdateRefreshTokenHashCommand(user.id, tokens.refreshToken))

    return tokens
  }

  /**
   * Revokes the user's refresh token.
   *
   * @param userId - User UUID.
   */
  async logout(userId: string): Promise<void> {
    await this.commandBus.execute(new UpdateRefreshTokenHashCommand(userId, null))
  }

  /**
   * Signs a new pair of access and refresh tokens.
   *
   * @param user - User entity to sign tokens for.
   * @returns TokenPair.
   */
  private async issueTokens(user: User): Promise<TokenPairDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: Number(this.config.getOrThrow<string>('JWT_ACCESS_TTL')),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.getOrThrow<string>('JWT_REFRESH_TTL')),
      }),
    ])

    return { accessToken, refreshToken }
  }
}
