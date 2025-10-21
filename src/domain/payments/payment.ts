export class Payment {
  constructor(
    public readonly id: string,
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly transactionId: string | null,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: string,
    public readonly pgProvider: string | null,
    public readonly status: string,
    public readonly failureReason: string | null,
    public readonly paidAt: Date | null,
    public readonly cancelledAt: Date | null,
    public readonly virtualAccountNumber: string | null,
    public readonly virtualAccountBank: string | null,
    public readonly virtualAccountHolder: string | null,
    public readonly virtualAccountExpiry: Date | null,
    public readonly portoneData: any | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
