import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

/** Input DTO for user login. */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string
}
