import { sendError } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  }
  return sendError(res, message, statusCode);
}
