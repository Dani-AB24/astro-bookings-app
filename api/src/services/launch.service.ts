import {
  Launch,
  LaunchStatus,
  CreateLaunchRequest,
  UpdateLaunchRequest,
  ValidationError,
} from '../types/launch';
import { logger } from '../utils/logger';
import { JsonRepository } from '../repositories/json.repository';
import { launchRepository } from '../utils/data-loader';

export class LaunchService {
  private repository: JsonRepository<Launch>;
  private nextId = 1;

  constructor(repository?: JsonRepository<Launch>) {
    // Use provided repository or create default in-memory one for backward compatibility
    if (repository) {
      this.repository = repository;
      // Calculate nextId from repository
      const allLaunches = this.repository.getAll();
      let maxId = 0;
      for (const launch of allLaunches) {
        const match = launch.id.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) {
            maxId = num;
          }
        }
      }
      this.nextId = maxId + 1;
    } else {
      // Fallback to in-memory Map for backward compatibility
      this.repository = new JsonRepository<Launch>('db/launches.json', 'db/seed/launches.json');
      this.repository.load();
      const allLaunches = this.repository.getAll();
      let maxId = 0;
      for (const launch of allLaunches) {
        const match = launch.id.match(/-(\d+)$/);
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
   * Creates a new launch
   * Throws if validation fails
   */
  create(req: CreateLaunchRequest, userId: string): Launch {
    const errors = this.validateCreate(req);
    if (errors.length > 0) {
      throw new Error('Validation failed');
    }

    const launchId = `launch-${this.nextId++}`;
    const slug = this.generateSlug(req.name);
    const now = new Date().toISOString();

    const launch: Launch = {
      id: launchId,
      name: req.name,
      rocket: req.rocket,
      slug: slug,
      price: req.price,
      date: req.date,
      duration: req.duration ?? 60,
      launchSite: req.launchSite,
      minSeats: req.minSeats,
      totalSeats: req.totalSeats,
      status: req.status ?? 'draft',
      userId: userId,
      createdAt: now,
    };

    this.repository.create(launch);
    logger.info('LaunchService', 'Launch created', { id: launchId, name: launch.name });
    return launch;
  }

  /**
   * Retrieves all launches
   * Returns array of all launches
   */
  getAll(): Launch[] {
    return this.repository.getAll();
  }

  /**
   * Queries launches with optional filters, search, and sorting
   * @param options Query options: q (search term), slug (filter by slug), _sort (field to sort by), _order (asc/desc)
   * @returns Filtered and sorted array of launches
   */
  query(options: {
    q?: string;
    slug?: string;
    _sort?: string;
    _order?: 'asc' | 'desc';
  }): Launch[] {
    let results = this.repository.getAll();

    // Filter by slug if provided
    if (options.slug) {
      results = results.filter((launch) => launch.slug === options.slug);
    }

    // Search by query term (searches in name, launchSite, and slug)
    if (options.q && options.q.trim() !== '') {
      const searchTerm = options.q.toLowerCase().trim();
      results = results.filter(
        (launch) =>
          launch.name.toLowerCase().includes(searchTerm) ||
          launch.launchSite.toLowerCase().includes(searchTerm) ||
          launch.slug.toLowerCase().includes(searchTerm)
      );
    }

    // Sort results
    if (options._sort) {
      const sortField = options._sort as keyof Launch;
      const order = options._order === 'desc' ? -1 : 1;

      results.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) {
          return bValue === undefined || bValue === null ? 0 : 1;
        }
        if (bValue === undefined || bValue === null) {
          return -1;
        }

        // Handle date strings (ISO format)
        if (sortField === 'date' || sortField === 'createdAt' || sortField === 'updatedAt') {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return (aDate - bDate) * order;
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * order;
        }

        // Handle strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * order;
        }

        // Fallback: convert to string and compare
        return String(aValue).localeCompare(String(bValue)) * order;
      });
    }

    return results;
  }

  /**
   * Retrieves a launch by ID
   * Returns undefined if not found
   */
  getById(id: string): Launch | undefined {
    return this.repository.getById(id);
  }

  /**
   * Updates an existing launch
   * Throws if validation fails or launch not found
   * Only updates if userId matches
   */
  update(id: string, req: UpdateLaunchRequest, userId: string): Launch {
    const launch = this.repository.getById(id);
    if (!launch) {
      throw new Error('Launch not found');
    }

    if (launch.userId !== userId) {
      throw new Error('Forbidden: You can only update your own launches');
    }

    const errors = this.validateUpdate(req, launch);
    if (errors.length > 0) {
      throw new Error('Validation failed');
    }

    // Copy only editable fields; id, userId, createdAt and computed fields are never taken from the request
    const editableFields = ['name', 'rocket', 'price', 'date', 'duration', 'launchSite', 'minSeats', 'totalSeats'] as const;
    const changes: Partial<Launch> = {};
    for (const field of editableFields) {
      if (req[field] !== undefined) {
        Object.assign(changes, { [field]: req[field] });
      }
    }

    const updatedLaunch: Launch = {
      ...launch,
      ...changes,
      // Regenerate slug if name changed
      slug: req.name ? this.generateSlug(req.name) : launch.slug,
      updatedAt: new Date().toISOString(),
    };

    this.repository.update(id, updatedLaunch);
    logger.info('LaunchService', 'Launch updated', { id, name: updatedLaunch.name });
    return updatedLaunch;
  }

  /**
   * Deletes a launch
   * Returns true if deleted, false if not found
   * Only deletes if userId matches
   */
  delete(id: string, userId: string): boolean {
    const launch = this.repository.getById(id);
    if (!launch) {
      return false;
    }

    if (launch.userId !== userId) {
      throw new Error('Forbidden: You can only delete your own launches');
    }

    this.repository.delete(id);
    logger.info('LaunchService', 'Launch deleted', { id, name: launch.name });
    return true;
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

    // Validate name
    if (!req.name || typeof req.name !== 'string' || req.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required and must be a non-empty string' });
    }

    // Validate rocket
    if (!req.rocket || typeof req.rocket !== 'string' || req.rocket.trim() === '') {
      errors.push({ field: 'rocket', message: 'Rocket is required and must be a non-empty string' });
    }

    // Validate price (try to parse from string)
    if (req.price === undefined || req.price === null) {
      errors.push({ field: 'price', message: 'Price is required and must be a positive number' });
    } else {
      const price = typeof req.price === 'string' ? Number(req.price) : req.price;
      if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        errors.push({ field: 'price', message: 'Price must be a positive number' });
      }
    }

    // Validate date
    if (!req.date || typeof req.date !== 'string' || req.date.trim() === '') {
      errors.push({ field: 'date', message: 'Date is required and must be a valid ISO date string' });
    } else {
      const date = new Date(req.date);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
      } else {
        // Check if date is in the future
        if (date <= new Date()) {
          errors.push({ field: 'date', message: 'Date must be in the future' });
        }
      }
    }

    // Validate duration (optional, defaults to 60, try to parse from string)
    if (req.duration !== undefined && req.duration !== null) {
      const duration = typeof req.duration === 'string' ? Number(req.duration) : req.duration;
      if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
        errors.push({ field: 'duration', message: 'Duration must be a positive number (in minutes)' });
      }
    }

    // Validate launchSite
    if (!req.launchSite || typeof req.launchSite !== 'string' || req.launchSite.trim() === '') {
      errors.push({ field: 'launchSite', message: 'Launch site is required and must be a non-empty string' });
    }

    // Validate minSeats (try to parse from string)
    let parsedMinSeats: number | undefined;
    if (req.minSeats === undefined || req.minSeats === null) {
      errors.push({ field: 'minSeats', message: 'Min seats is required and must be at least 1' });
    } else {
      let parsed: number;
      if (typeof req.minSeats === 'string') {
        parsed = Number(req.minSeats);
      } else if (typeof req.minSeats === 'number') {
        parsed = req.minSeats;
      } else {
        parsed = NaN;
      }
      parsedMinSeats = parsed;
      if (typeof parsed !== 'number' || isNaN(parsed) || parsed < 1) {
        errors.push({ field: 'minSeats', message: 'Min seats must be at least 1' });
      }
    }

    // Validate totalSeats (try to parse from string)
    let parsedTotalSeats: number | undefined;
    if (req.totalSeats === undefined || req.totalSeats === null) {
      errors.push({ field: 'totalSeats', message: 'Total seats is required and must be at least 1' });
    } else {
      let parsed: number;
      if (typeof req.totalSeats === 'string') {
        parsed = Number(req.totalSeats);
      } else if (typeof req.totalSeats === 'number') {
        parsed = req.totalSeats;
      } else {
        parsed = NaN;
      }
      parsedTotalSeats = parsed;
      if (typeof parsed !== 'number' || isNaN(parsed) || parsed < 1) {
        errors.push({ field: 'totalSeats', message: 'Total seats must be at least 1' });
      }
    }

    // Validate minSeats <= totalSeats
    if (
      parsedMinSeats !== undefined &&
      parsedTotalSeats !== undefined &&
      typeof parsedMinSeats === 'number' &&
      typeof parsedTotalSeats === 'number' &&
      !isNaN(parsedMinSeats) &&
      !isNaN(parsedTotalSeats) &&
      parsedMinSeats > parsedTotalSeats
    ) {
      errors.push({
        field: 'minSeats',
        message: 'Min seats must be less than or equal to total seats',
      });
    }

    // Validate status (optional, defaults to 'draft')
    if (req.status !== undefined && req.status !== null) {
      const validStatuses = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
      if (typeof req.status !== 'string' || !validStatuses.includes(req.status)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    return errors;
  }

  /**
   * Validates update request
   * Returns array of all validation errors (empty if valid)
   */
  validateUpdate(data: unknown, existingLaunch: Launch): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
    }

    const req = data as Record<string, unknown>;

    // Validate name if provided
    if (req.name !== undefined) {
      if (typeof req.name !== 'string' || req.name.trim() === '') {
        errors.push({ field: 'name', message: 'Name must be a non-empty string' });
      }
    }

    // Validate rocket if provided
    if (req.rocket !== undefined) {
      if (typeof req.rocket !== 'string' || req.rocket.trim() === '') {
        errors.push({ field: 'rocket', message: 'Rocket must be a non-empty string' });
      }
    }

    // Validate price if provided
    if (req.price !== undefined) {
      if (typeof req.price !== 'number' || req.price <= 0) {
        errors.push({ field: 'price', message: 'Price must be a positive number' });
      }
    }

    // Validate date if provided
    if (req.date !== undefined) {
      if (typeof req.date !== 'string' || req.date.trim() === '') {
        errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
      } else {
        const date = new Date(req.date);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'date', message: 'Date must be a valid ISO date string' });
        } else {
          // Check if date is in the future
          if (date <= new Date()) {
            errors.push({ field: 'date', message: 'Date must be in the future' });
          }
        }
      }
    }

    // Validate duration if provided
    if (req.duration !== undefined) {
      if (typeof req.duration !== 'number' || req.duration <= 0) {
        errors.push({ field: 'duration', message: 'Duration must be a positive number (in minutes)' });
      }
    }

    // Validate launchSite if provided
    if (req.launchSite !== undefined) {
      if (typeof req.launchSite !== 'string' || req.launchSite.trim() === '') {
        errors.push({ field: 'launchSite', message: 'Launch site must be a non-empty string' });
      }
    }

    // Validate minSeats if provided
    if (req.minSeats !== undefined) {
      if (typeof req.minSeats !== 'number' || req.minSeats < 1) {
        errors.push({ field: 'minSeats', message: 'Min seats must be at least 1' });
      }
    }

    // Validate totalSeats if provided
    if (req.totalSeats !== undefined) {
      if (typeof req.totalSeats !== 'number' || req.totalSeats < 1) {
        errors.push({ field: 'totalSeats', message: 'Total seats must be at least 1' });
      }
    }

    // Validate minSeats <= totalSeats
    const minSeats = req.minSeats !== undefined ? req.minSeats : existingLaunch.minSeats;
    const totalSeats = req.totalSeats !== undefined ? req.totalSeats : existingLaunch.totalSeats;
    if (typeof minSeats === 'number' && typeof totalSeats === 'number' && minSeats > totalSeats) {
      errors.push({
        field: 'minSeats',
        message: 'Min seats must be less than or equal to total seats',
      });
    }

    // Validate status if provided - status changes must go through PATCH /launches/:id/status endpoint
    if (req.status !== undefined) {
      errors.push({
        field: 'status',
        message: 'Status cannot be changed via PUT endpoint. Use PATCH /launches/:id/status to transition status.',
      });
    }

    return errors;
  }

  /**
   * Returns valid next statuses for a given current status
   * Useful for error messages and validation
   */
  getValidTransitions(currentStatus: LaunchStatus): LaunchStatus[] {
    const transitionMap: Record<LaunchStatus, LaunchStatus[]> = {
      draft: ['published'],
      published: ['confirmed', 'cancelled', 'sold-out'],
      confirmed: ['done', 'cancelled'],
      'sold-out': ['confirmed'],
      done: [], // Terminal state - no transitions allowed
      cancelled: [], // Terminal state - no transitions allowed
    };

    return transitionMap[currentStatus] || [];
  }

  /**
   * Validates if a status transition is allowed
   * Returns true if transition is valid, false otherwise
   */
  isValidStatusTransition(currentStatus: LaunchStatus, targetStatus: LaunchStatus): boolean {
    const validTransitions = this.getValidTransitions(currentStatus);
    return validTransitions.includes(targetStatus);
  }

  /**
   * Transitions a launch to a new status
   * Validates the transition and ownership
   * Throws if validation fails, launch not found, or ownership mismatch
   */
  transitionStatus(id: string, targetStatus: LaunchStatus, userId: string): Launch {
    const launch = this.repository.getById(id);
    if (!launch) {
      throw new Error('Launch not found');
    }

    if (launch.userId !== userId) {
      throw new Error('Forbidden: You can only transition your own launches');
    }

    if (!this.isValidStatusTransition(launch.status, targetStatus)) {
      const validTransitions = this.getValidTransitions(launch.status);
      throw new Error(
        `Invalid status transition from ${launch.status} to ${targetStatus}. Valid transitions are: ${validTransitions.join(', ') || 'none (terminal state)'}`
      );
    }

    const updatedLaunch: Launch = {
      ...launch,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    this.repository.update(id, updatedLaunch);
    logger.info('LaunchService', 'Launch status transitioned', {
      id,
      from: launch.status,
      to: targetStatus,
    });
    return updatedLaunch;
  }

  /**
   * Generates a URL-friendly slug from a name
   * Converts to lowercase, replaces spaces with hyphens, removes special characters
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

export const launchService = new LaunchService(launchRepository);
