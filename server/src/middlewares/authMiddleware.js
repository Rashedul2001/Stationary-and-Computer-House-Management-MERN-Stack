import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../config/auth.js';
import { sendError } from '../utils/apiResponse.js';

export async function verifyAuth(req, res, next) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return sendError(res, 'Unauthorized. Please log in to continue.', 401);
    }

    req.user = session.user;
    req.session = session.session;
    return next();
  } catch (err) {
    return next(err);
  }
}

export function verifyAdmin(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Unauthorized.', 401);
  }
  if (req.user.role !== 'admin') {
    return sendError(res, 'Forbidden. Admin access is required.', 403);
  }
  return next();
}
