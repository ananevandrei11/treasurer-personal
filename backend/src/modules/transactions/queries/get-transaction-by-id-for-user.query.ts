export class GetTransactionByIdForUserQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
