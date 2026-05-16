import type { UserDto } from '../../users/dto/user.dto'

export class TokenPairDto {
  accessToken!: string
  refreshToken!: string
}

export class AuthResponseDto extends TokenPairDto {
  user!: UserDto
}
