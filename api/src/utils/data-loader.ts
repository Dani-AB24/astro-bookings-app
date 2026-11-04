import { JsonRepository } from '../repositories/json.repository';
import { Launch } from '../types/launch';
import { User } from '../types/user';
import { Booking } from '../types/booking';
import { Payment } from '../types/payment';
import { logger } from './logger';

/**
 * Repository instances - shared across the application
 */
export const launchRepository = new JsonRepository<Launch>('db/launches.json', 'db/seed/launches.json');
export const userRepository = new JsonRepository<User>('db/users.json', 'db/seed/users.json');
export const bookingRepository = new JsonRepository<Booking>('db/bookings.json');
export const paymentRepository = new JsonRepository<Payment>('db/payments.json');

/**
 * Loads all seed data and persisted data on application startup
 */
export function loadAllData(): void {
  logger.info('DataLoader', 'Loading data from repositories...');
  
  try {
    launchRepository.load();
    logger.info('DataLoader', 'Launches loaded');
  } catch (error) {
    logger.error('DataLoader', 'Failed to load launches', error);
  }

  try {
    userRepository.load();
    logger.info('DataLoader', 'Users loaded');
  } catch (error) {
    logger.error('DataLoader', 'Failed to load users', error);
  }

  try {
    bookingRepository.load();
    logger.info('DataLoader', 'Bookings loaded');
  } catch (error) {
    logger.error('DataLoader', 'Failed to load bookings', error);
  }

  try {
    paymentRepository.load();
    logger.info('DataLoader', 'Payments loaded');
  } catch (error) {
    logger.error('DataLoader', 'Failed to load payments', error);
  }

  logger.info('DataLoader', 'Data loading completed');
}

// Loaded on import, because services read these repositories when they are constructed.
loadAllData();
