export class NewPayment {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly currency: string = 'KRW',
    public readonly pgProvider: string | null = null,
    public readonly transactionId: string | null = null,
  ) {}
}
