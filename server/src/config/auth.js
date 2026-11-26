import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins/admin';
import mongoose from 'mongoose';
import { getMongoDb } from './db.js';
import { sendPasswordResetEmail } from './email.js';

let authInstance = null;

export function getAuth() {
  if (authInstance) return authInstance;

  const client = mongoose.connection.getClient();
  const db = getMongoDb();

  authInstance = betterAuth({
    database: mongodbAdapter(db, { client, transaction: false }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
    trustedOrigins: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 6,
      async sendResetPassword({ user, url }) {
        await sendPasswordResetEmail({
          to: user.email,
          url,
          userName: user.name,
        });
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'assistant',
          input: false,
        },
        imagePublicId: {
          type: 'string',
          defaultValue: '',
          input: false,
        },
      },
    },
    plugins: [
      admin({
        defaultRole: 'assistant',
        adminRoles: ['admin'],
      }),
    ],
  });

  return authInstance;
}
