/**
 * Launch status type - matches client type definition
 */
export type LaunchStatus =
  | 'published'
  | 'confirmed'
  | 'sold-out'
  | 'done'
  | 'cancelled'
  | 'draft';

/**
 * Domain entity - represents a launch as stored in the system
 */
export interface Launch {
  id: string;
  name: string;
  rocket: string;
  slug: string;
  price: number;
  date: string; // ISO date string
  duration: number; // in minutes
  launchSite: string;
  minSeats: number;
  totalSeats: number;
  status: LaunchStatus;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request DTO for creating a new launch
 */
export interface CreateLaunchRequest {
  name: string;
  rocket: string;
  price: number;
  date: string; // ISO date string
  duration?: number; // in minutes, defaults to 60
  launchSite: string;
  minSeats: number;
  totalSeats: number;
  status?: LaunchStatus; // defaults to 'draft'
}

/**
 * Request DTO for updating a launch
 */
export interface UpdateLaunchRequest {
  name?: string;
  rocket?: string;
  price?: number;
  date?: string; // ISO date string
  duration?: number; // in minutes
  launchSite?: string;
  minSeats?: number;
  totalSeats?: number;
  status?: LaunchStatus;
}

/**
 * Validation error response format
 * Returned when validation fails (HTTP 400)
 * @deprecated Use ValidationError from '../types/error' instead
 */
export type { ValidationError } from './error';
