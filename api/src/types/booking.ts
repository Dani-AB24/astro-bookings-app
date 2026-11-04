import type { PaymentStatus } from './payment';

/**
 * Domain entity - represents a booking as stored in the system
 */
export interface Booking {
  id: string;
  launchId: string;
  userId: string;
  seats: number;
  createdAt: string;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
}

/**
 * Request DTO for creating a new booking
 */
export interface CreateBookingRequest {
  launchId: string;
  seats: number;
}

export type { PaymentStatus };

/**
 * Launch information included in booking responses
 */
export interface BookingLaunchInfo {
  name: string;
  rocket: string;
  slug: string;
  price: number;
  date: string;
  duration: number;
  launchSite: string;
  status: string;
}

/**
 * Response DTO for booking retrieval - includes booking details with launch information and payment status
 */
export interface BookingResponse {
  id: string;
  launchId: string;
  userId: string;
  seats: number;
  createdAt: string;
  paymentId?: string;
  paymentStatus: PaymentStatus;
  launch: BookingLaunchInfo;
}

/**
 * Validation error response format
 * Returned when validation fails (HTTP 400)
 * @deprecated Use ValidationError from '../types/error' instead
 */
export type { ValidationError } from './error';
