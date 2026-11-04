import { CreateResourceRequest, Resource, UpdateResourceRequest, ValidationError } from '../types/resource';
import { Repository } from '../repositories/base.repository';
import { resourceRepository } from '../utils/data-loader';
import { logger } from '../utils/logger';

export class ResourceService {
  private nextId: number;

  constructor(private repository: Repository<Resource>) {
    const usedIds = repository.getAll().map((resource) => Number(resource.id.split('-').pop()) || 0);
    this.nextId = Math.max(0, ...usedIds) + 1;
  }

  /**
   * Creates a new resource
   * Throws if validation fails
   */
  create(req: CreateResourceRequest): Resource {
    const resource: Resource = {
      id: `resource-${this.nextId++}`,
      ...req,
      createdAt: new Date().toISOString(),
    };
    this.repository.create(resource);
    logger.info('ResourceService', 'Resource created', { id: resource.id });
    return resource;
  }

  /**
   * Retrieves a resource by ID
   * Returns undefined if not found
   */
  getById(id: string): Resource | undefined {
    return this.repository.getById(id);
  }

  /**
   * Retrieves all resources
   */
  getAll(): Resource[] {
    return this.repository.getAll();
  }

  /**
   * Updates an existing resource
   * Throws if resource not found
   */
  update(id: string, req: UpdateResourceRequest): Resource {
    const existing = this.repository.getById(id);
    if (!existing) {
      throw new Error(`Resource ${id} not found`);
    }

    const updated = { 
      ...existing, 
      ...req,
      updatedAt: new Date().toISOString(),
    };
    this.repository.update(id, updated);
    logger.info('ResourceService', 'Resource updated', { id });
    return updated;
  }

  /**
   * Deletes a resource
   * Does not throw if not found (idempotent delete)
   */
  delete(id: string): void {
    if (this.repository.delete(id)) {
      logger.info('ResourceService', 'Resource deleted', { id });
    }
  }

  /**
   * Validates create request
   * Returns array of all validation errors (empty if valid)
   */
  validate(data: unknown): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type check
    if (!data || typeof data !== 'object') {
      return [{ field: 'body', message: 'Request body must be a valid JSON object' }];
    }

    const req = data as Record<string, unknown>;

    // Validate required string fields
    if (!req.name || typeof req.name !== 'string' || req.name.trim() === '') {
      errors.push({ 
        field: 'name', 
        message: 'Name is required and must be a non-empty string' 
      });
    }

    // Validate enum fields
    if (req.status && !['active', 'inactive', 'retired'].includes(String(req.status))) {
      errors.push({ 
        field: 'status', 
        message: 'Status must be one of: active, inactive, retired' 
      });
    }

    // Validate numeric fields (if applicable)
    if (req.capacity !== undefined) {
      const capacity = Number(req.capacity);
      if (!Number.isInteger(capacity) || capacity <= 0) {
        errors.push({ 
          field: 'capacity', 
          message: 'Capacity must be a positive integer' 
        });
      }
    }

    return errors;
  }

  /**
   * Validates update request
   * Checks existence first, then validates payload
   * Returns array of all validation errors (empty if valid)
   */
  validateUpdate(id: string, data: unknown): ValidationError[] {
    // Check if resource exists
    if (!this.repository.getById(id)) {
      return [{ 
        field: 'id', 
        message: `Resource ${id} not found` 
      }];
    }

    // Validate the update payload (same rules as create)
    return this.validate(data);
  }
}

// Shared so that every route sees the same ID counter and any indexes.
export const resourceService = new ResourceService(resourceRepository);
