import {
  Booking,
  BookingResponse,
  CreateBookingRequest,
  PaymentStatus,
  ValidationError,
} from '../types/booking';
import { LaunchService, launchService } from './launch.service';
import { PaymentService } from './payment.service';
import { MockPaymentGateway } from './mock-payment-gateway';
import { logger } from '../utils/logger';
import { JsonRepository } from '../repositories/json.repository';
import { bookingRepository, paymentRepository } from '../utils/data-loader';

export class BookingService {
  private repository: JsonRepository<Booking>;
  private nextId = 1;
  private launchService: LaunchService;
  private paymentService: PaymentService;

  constructor(
    launchService: LaunchService,
    paymentService: PaymentService,
    repository?: JsonRepository<Booking>
  ) {
    this.launchService = launchService;
    this.paymentService = paymentService;
    
    if (repository) {
      this.repository = repository;
      // Calculate nextId from repository
      const allBookings = this.repository.getAll();
      let maxId = 0;
      for (const booking of allBookings) {
        const match = booking.id.match(/-(\d+)$/);
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
      this.repository = new JsonRepository<Booking>('db/bookings.json');
      this.repository.load();
      const allBookings = this.repository.getAll();
      let maxId = 0;
      for (const booking of allBookings) {
        const match = booking.id.match(/-(\d+)$/);
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
   * Creates a new booking.
   * Charges via mock gateway first; on success creates payment and booking.
   * Throws if validation fails, launch not found, capacity exceeded, or payment fails.
   */
  create(req: CreateBookingRequest, userId: string): Booking {
    const errors = this.validateCreate(req);
    if (errors.length > 0) {
      throw new Error('Validation failed');
    }

    const launch = this.launchService.getById(req.launchId);
    if (!launch) {
      throw new Error('Launch not found');
    }

    if (launch.status !== 'published') {
      throw new Error('Launch is not open for booking');
    }

    const availableCapacity = this.calculateAvailableCapacity(req.launchId);
    if (req.seats > availableCapacity) {
      throw new Error(`Capacity exceeded. Available: ${availableCapacity}, Requested: ${req.seats}`);
    }

    const amount = launch.price * req.seats;
    const bookingId = `booking-${this.nextId++}`;

    const payment = this.paymentService.createForBooking(
      bookingId,
      amount,
      userId,
      req.launchId
    );

    const now = new Date().toISOString();
    const paymentStatus: PaymentStatus = 'paid';

    const booking: Booking = {
      id: bookingId,
      launchId: req.launchId,
      userId,
      seats: req.seats,
      createdAt: now,
      paymentId: payment.id,
      paymentStatus,
    };

    this.repository.create(booking);
    logger.info('BookingService', 'Booking created', {
      id: bookingId,
      launchId: req.launchId,
      seats: req.seats,
      paymentId: payment.id,
    });
    return booking;
  }

  /**
   * Retrieves all bookings for a specific launch
   * Returns array of bookings filtered by launchId
   */
  getBookingsByLaunchId(launchId: string): Booking[] {
    return this.repository.getAll().filter((booking) => booking.launchId === launchId);
  }

  /**
   * Calculates available capacity for a launch
   * Returns available capacity as launch.totalSeats minus sum of seats from existing bookings
   */
  calculateAvailableCapacity(launchId: string): number {
    const launch = this.launchService.getById(launchId);
    if (!launch) {
      return 0;
    }

    const existingBookings = this.getBookingsByLaunchId(launchId);
    const totalBookedSeats = existingBookings.reduce((sum, booking) => sum + booking.seats, 0);
    const availableCapacity = launch.totalSeats - totalBookedSeats;

    return Math.max(0, availableCapacity);
  }

  /**
   * Retrieves all bookings for a specific user
   * Returns array of bookings filtered by userId
   */
  getAllByUserId(userId: string): Booking[] {
    return this.repository.getAll().filter((booking) => booking.userId === userId);
  }

  /**
   * Retrieves a booking by ID
   * Returns undefined if not found
   */
  getById(id: string): Booking | undefined {
    return this.repository.getById(id);
  }

  /**
   * Retrieves a booking by ID and validates it belongs to the user
   * Throws if booking not found or does not belong to user
   */
  getUserBookingById(id: string, userId: string): Booking {
    const booking = this.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.userId !== userId) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  /**
   * Enriches booking with launch information
   * Returns booking response with launch details
   */
  enrichBookingWithLaunch(booking: Booking): BookingResponse {
    const launch = this.launchService.getById(booking.launchId);
    if (!launch) {
      throw new Error('Launch not found');
    }

    return {
      id: booking.id,
      launchId: booking.launchId,
      userId: booking.userId,
      seats: booking.seats,
      createdAt: booking.createdAt,
      paymentId: booking.paymentId,
      paymentStatus: this.enrichBookingWithPaymentStatus(booking),
      launch: {
        name: launch.name,
        rocket: launch.rocket,
        slug: launch.slug,
        price: launch.price,
        date: launch.date,
        duration: launch.duration,
        launchSite: launch.launchSite,
        status: launch.status,
      },
    };
  }

  /**
   * Resolves payment status for a booking.
   * Uses stored paymentStatus when present; otherwise 'pending'.
   */
  enrichBookingWithPaymentStatus(booking: Booking): PaymentStatus {
    return booking.paymentStatus ?? 'pending';
  }

  /**
   * Validates create request
   * Returns array of all validation errors (empty if valid)
   */
  validateCreate(data: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
    }

    const req = data as Record<string, unknown>;

    // Validate launchId
    if (!req.launchId || typeof req.launchId !== 'string' || req.launchId.trim() === '') {
      errors.push({ field: 'launchId', message: 'Launch ID is required and must be a non-empty string' });
    }

    // Validate seats
    if (typeof req.seats !== 'number' || !Number.isInteger(req.seats) || req.seats < 1) {
      errors.push({
        field: 'seats',
        message: 'Seats is required and must be a whole number (at least 1)',
      });
    }

    return errors;
  }
}

const paymentService = new PaymentService(new MockPaymentGateway(), paymentRepository);
export const bookingService = new BookingService(launchService, paymentService, bookingRepository);
