import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from '../../users/dto/user.dto'

/** Pair of JWT access and refresh tokens. */
export class TokenPairDto {
  @ApiProperty({ description: 'Short-lived JWT access token' })
  accessToken!: string

  @ApiProperty({ description: 'Long-lived JWT refresh token' })
  refreshToken!: string
}

/** Complete authentication response including user profile. */
export class AuthResponseDto extends TokenPairDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto
}
