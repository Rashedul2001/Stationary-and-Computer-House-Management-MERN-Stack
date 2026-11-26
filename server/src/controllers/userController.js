import mongoose from 'mongoose';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../config/auth.js';
import { getMongoDb } from '../config/db.js';
import { uploadImageBuffer, deleteCloudinaryImage } from '../services/cloudinaryService.js';
import { recordActivity } from '../services/activityLogService.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

function formatUserDoc(u) {
  return {
    id: String(u.id || u._id),
    name: u.name,
    email: u.email,
    image: u.image || '',
    imagePublicId: u.imagePublicId || '',
    role: u.role || 'assistant',
    createdAt: u.createdAt,
  };
}

export async function listUsers(req, res, next) {
  try {
    const { search = '' } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const q = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }
    const users = await getMongoDb().collection('user').find(filter).sort({ createdAt: -1 }).toArray();
    return sendSuccess(res, users.map(formatUserDoc));
  } catch (err) {
    return next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'assistant' } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return sendError(res, 'Name, valid email, and password (min 6 chars) are required.', 400);
    }

    const existing = await getMongoDb().collection('user').findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, 'A user with this email already exists.', 409);
    }

    let image = '';
    let imagePublicId = '';
    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, 'laksam_it_house/users');
      image = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const auth = getAuth();
    const created = await auth.api.createUser({
      body: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: role === 'admin' ? 'admin' : 'assistant',
        data: { image, imagePublicId },
      },
      headers: fromNodeHeaders(req.headers),
    });

    await recordActivity({
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: created?.user?.id || '',
      summary: `Created user ${email} (${role})`,
      dataSnapshot: { name, email, role, image },
      user: req.user,
    });

    return sendSuccess(res, formatUserDoc(created.user), 'User created successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = req.params.id;
    const { name, email, password, role } = req.body;
    const auth = getAuth();
    const headers = fromNodeHeaders(req.headers);

    const db = getMongoDb();
    const objectIdQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ id: userId }, { _id: new mongoose.Types.ObjectId(userId) }] }
      : { id: userId };
    const current = await db.collection('user').findOne(objectIdQuery);
    if (!current) return sendError(res, 'User not found.', 404);

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) updateData.email = email.toLowerCase().trim();
    if (role === 'admin' || role === 'assistant') {
      if (String(current.id || current._id) === String(req.user.id) && role !== 'admin') {
        return sendError(res, 'You cannot remove your own admin role.', 400);
      }
      updateData.role = role;
    }

    let oldPublicId = '';
    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, 'laksam_it_house/users');
      oldPublicId = current.imagePublicId || '';
      updateData.image = uploaded.url;
      updateData.imagePublicId = uploaded.publicId;
    }

    const updated = await auth.api.adminUpdateUser({
      body: { userId, data: updateData },
      headers,
    });

    if (password && password.trim().length >= 6) {
      await auth.api.setUserPassword({
        body: { userId, newPassword: password.trim() },
        headers,
      });
    }

    if (oldPublicId) {
      await deleteCloudinaryImage(oldPublicId);
    }

    await recordActivity({
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: userId,
      summary: `Updated user ${updateData.email || current.email}`,
      dataSnapshot: { userId, ...updateData, passwordUpdated: Boolean(password) },
      user: req.user,
    });

    return sendSuccess(res, formatUserDoc(updated?.user || { ...current, ...updateData }), 'User updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;
    if (String(userId) === String(req.user.id)) {
      return sendError(res, 'You cannot delete your own active account.', 400);
    }

    const db = getMongoDb();
    const objectIdQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ id: userId }, { _id: new mongoose.Types.ObjectId(userId) }] }
      : { id: userId };
    const target = await db.collection('user').findOne(objectIdQuery);
    if (!target) return sendError(res, 'User not found.', 404);

    const auth = getAuth();
    await auth.api.removeUser({
      body: { userId },
      headers: fromNodeHeaders(req.headers),
    });

    if (target.imagePublicId) {
      await deleteCloudinaryImage(target.imagePublicId);
    }

    await recordActivity({
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: userId,
      summary: `Deleted user ${target.email}`,
      dataSnapshot: { email: target.email, name: target.name },
      user: req.user,
    });

    return sendSuccess(res, { id: userId }, 'User deleted.');
  } catch (err) {
    return next(err);
  }
}
