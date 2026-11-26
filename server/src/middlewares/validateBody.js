import { sendError } from '../utils/apiResponse.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, formatted[0]?.message || 'Validation failed', 400, formatted);
    }
    req.validatedBody = result.data;
    return next();
  };
}
