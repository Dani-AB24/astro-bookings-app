import { Request, Response, Router } from 'express';
import { LaunchService } from '../services/launch.service';
import { LaunchStatus, CreateLaunchRequest, UpdateLaunchRequest } from '../types/launch';
import { AuthenticatedRequest } from '../types/auth';
import { ErrorResponse } from '../types/error';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { launchRepository } from '../utils/data-loader';

const router = Router();
const launchService = new LaunchService(launchRepository);

/**
 * Normalizes create request body:
 * - Parses numeric strings to numbers (price, duration, minSeats, totalSeats)
 * - Applies default values (duration: 60, status: 'draft')
 */
function normalizeCreateRequest(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const req = body as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...req };

  // Parse numeric fields from strings
  if (req.price !== undefined) {
    const price = typeof req.price === 'string' ? Number(req.price) : req.price;
    normalized.price = price;
  }

  if (req.duration !== undefined) {
    const duration = typeof req.duration === 'string' ? Number(req.duration) : req.duration;
    normalized.duration = duration;
  }

  if (req.minSeats !== undefined) {
    const minSeats = typeof req.minSeats === 'string' ? Number(req.minSeats) : req.minSeats;
    normalized.minSeats = minSeats;
  }

  if (req.totalSeats !== undefined) {
    const totalSeats = typeof req.totalSeats === 'string' ? Number(req.totalSeats) : req.totalSeats;
    normalized.totalSeats = totalSeats;
  }

  // Apply defaults
  if (normalized.duration === undefined || normalized.duration === null) {
    normalized.duration = 60;
  }

  if (normalized.status === undefined || normalized.status === null) {
    normalized.status = 'draft';
  }

  return normalized;
}

/**
 * POST /launches
 * Creates a new launch
 * Requires authentication
 * Returns 201 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  
  // Normalize request body: parse numeric strings and apply defaults
  const normalizedBody = normalizeCreateRequest(req.body);
  
  const errors = launchService.validateCreate(normalizedBody);
  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      message: 'Validation failed',
      errors,
    };
    return res.status(400).json(errorResponse);
  }

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const launch = launchService.create(normalizedBody as unknown as CreateLaunchRequest, authReq.user.id);
    res.status(201).json(launch);
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to create launch', error);
    const errorResponse: ErrorResponse = {
      message: 'Failed to create launch',
      errors: [],
    };
    res.status(400).json(errorResponse);
  }
});

/**
 * GET /launches
 * Lists all launches with optional query parameters
 * Query parameters:
 *   - q: Search term (searches in name, launchSite, slug)
 *   - slug: Filter by exact slug match
 *   - _sort: Field to sort by (e.g., 'id', 'name', 'date')
 *   - _order: Sort order ('asc' or 'desc', defaults to 'asc')
 * No authentication required
 * Returns 200 with array of launches
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const queryParams = req.query;
    const hasQueryParams = queryParams.q || queryParams.slug || queryParams._sort;

    let launches: ReturnType<typeof launchService.getAll>;
    if (hasQueryParams) {
      launches = launchService.query({
        q: queryParams.q as string | undefined,
        slug: queryParams.slug as string | undefined,
        _sort: queryParams._sort as string | undefined,
        _order: (queryParams._order as 'asc' | 'desc' | undefined) || 'asc',
      });
    } else {
      launches = launchService.getAll();
    }

    res.status(200).json(launches);
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to get launches', error);
    const errorResponse: ErrorResponse = {
      message: 'Failed to retrieve launches',
      errors: [],
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /launches/:id
 * Gets a specific launch by ID
 * No authentication required
 * Returns 200 on success, 404 if not found
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const launch = launchService.getById(req.params.id);
    if (!launch) {
      const errorResponse: ErrorResponse = {
        message: 'Launch not found',
        errors: [],
      };
      return res.status(404).json(errorResponse);
    }
    res.status(200).json(launch);
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to get launch', error);
    const errorResponse: ErrorResponse = {
      message: 'Failed to retrieve launch',
      errors: [],
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * PUT /launches/:id
 * Updates an existing launch
 * Requires authentication and ownership
 * Returns 200 on success, 400 on validation error, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.put('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const existingLaunch = launchService.getById(req.params.id);
  
  if (!existingLaunch) {
    const errorResponse: ErrorResponse = {
      message: 'Launch not found',
      errors: [],
    };
    return res.status(404).json(errorResponse);
  }

  const errors = launchService.validateUpdate(req.body, existingLaunch);
  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      message: 'Validation failed',
      errors,
    };
    return res.status(400).json(errorResponse);
  }

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const launch = launchService.update(req.params.id, req.body as UpdateLaunchRequest, authReq.user.id);
    res.status(200).json(launch);
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to update launch', error);
    let message = 'Failed to update launch';
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message === 'Launch not found') {
        message = 'Launch not found';
        statusCode = 404;
      } else if (error.message.includes('Forbidden')) {
        message = 'You can only update your own launches';
        statusCode = 403;
      }
    }
    
    const errorResponse: ErrorResponse = {
      message,
      errors: [],
    };
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * DELETE /launches/:id
 * Deletes a launch
 * Requires authentication and ownership
 * Returns 204 on success, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const deleted = launchService.delete(req.params.id, authReq.user.id);
    if (!deleted) {
      const errorResponse: ErrorResponse = {
        message: 'Launch not found',
        errors: [],
      };
      return res.status(404).json(errorResponse);
    }
    res.status(204).send();
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to delete launch', error);
    let message = 'Failed to delete launch';
    let statusCode = 500;
    
    if (error instanceof Error && error.message.includes('Forbidden')) {
      message = 'You can only delete your own launches';
      statusCode = 403;
    }
    
    const errorResponse: ErrorResponse = {
      message,
      errors: [],
    };
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * PATCH /launches/:id/status
 * Transitions a launch to a new status
 * Requires authentication and ownership
 * Returns 200 on success, 400 on invalid transition, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.patch('/:id/status', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  // Validate request body
  if (!req.body || typeof req.body !== 'object') {
    const errorResponse: ErrorResponse = {
      message: 'Request body must be a valid JSON object',
      errors: [],
    };
    return res.status(400).json(errorResponse);
  }

  if (!req.body.status || typeof req.body.status !== 'string') {
    const errorResponse: ErrorResponse = {
      message: 'Status field is required and must be a string',
      errors: [],
    };
    return res.status(400).json(errorResponse);
  }

  const validStatuses: LaunchStatus[] = ['draft', 'published', 'confirmed', 'sold-out', 'done', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    const errorResponse: ErrorResponse = {
      message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`,
      errors: [],
    };
    return res.status(400).json(errorResponse);
  }

  try {
    if (!authReq.user) {
      const errorResponse: ErrorResponse = {
        message: 'Authentication required',
        errors: [],
      };
      return res.status(401).json(errorResponse);
    }

    const launch = launchService.transitionStatus(
      req.params.id,
      req.body.status as LaunchStatus,
      authReq.user.id
    );
    res.status(200).json(launch);
  } catch (error) {
    logger.error('LaunchRoute', 'Failed to transition launch status', error);
    let message = 'Failed to transition launch status';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message === 'Launch not found') {
        message = 'Launch not found';
        statusCode = 404;
      } else if (error.message.includes('Forbidden')) {
        message = 'You can only transition your own launches';
        statusCode = 403;
      } else if (error.message.includes('Invalid status transition')) {
        message = error.message;
        statusCode = 400;
      }
    }
    
    const errorResponse: ErrorResponse = {
      message,
      errors: [],
    };
    res.status(statusCode).json(errorResponse);
  }
});

export default router;
