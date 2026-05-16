export class UpdateRefreshTokenHashCommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string | null,
  ) {}
}
