import { Payment, PaymentStatus } from '../types/payment';
import { MockPaymentGatewayAdapter } from '../types/payment';
import { logger } from '../utils/logger';
import { JsonRepository } from '../repositories/json.repository';

export class PaymentService {
  private repository: JsonRepository<Payment>;
  private nextId = 1;
  private gateway: MockPaymentGatewayAdapter;

  constructor(gateway: MockPaymentGatewayAdapter, repository?: JsonRepository<Payment>) {
    this.gateway = gateway;
    
    if (repository) {
      this.repository = repository;
      // Calculate nextId from repository
      const allPayments = this.repository.getAll();
      let maxId = 0;
      for (const payment of allPayments) {
        const match = payment.id.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) {
            maxId = num;
          }
        }
      }
      this.nextId = maxId + 1;
    } else {
      // Fallback to in-memory for backward compatibility
      this.repository = new JsonRepository<Payment>('db/payments.json');
      this.repository.load();
      const allPayments = this.repository.getAll();
      let maxId = 0;
      for (const payment of allPayments) {
        const match = payment.id.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) {
            maxId = num;
          }
        }
      }
      this.nextId = maxId + 1;
    }
  }

  /**
   * Charges via mock gateway and creates a payment on success.
   * Throws if gateway returns failure; no payment is created.
   */
  createForBooking(
    bookingId: string,
    amount: number,
    userId: string,
    activityId: string
  ): Payment {
    const result = this.gateway.charge(amount, {
      userId,
      bookingId,
      activityId,
    });

    if (!result.success) {
      throw new Error('Payment could not be processed');
    }

    const paymentId = `payment-${this.nextId++}`;
    const now = new Date().toISOString();
    const status: PaymentStatus = 'paid';

    const payment: Payment = {
      id: paymentId,
      bookingId,
      amount,
      status,
      createdAt: now,
    };

    this.repository.create(payment);
    logger.info('PaymentService', 'Payment created', {
      id: paymentId,
      bookingId,
      amount,
      status,
    });
    return payment;
  }

  getById(id: string): Payment | undefined {
    return this.repository.getById(id);
  }
}
