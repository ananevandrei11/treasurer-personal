export type User = {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type AuthResponse = {
  user: User
} & TokenPair
