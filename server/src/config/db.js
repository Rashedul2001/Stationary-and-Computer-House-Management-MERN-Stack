import mongoose from 'mongoose';

export function getDatabaseName() {
  return process.env.MONGODB_NAME?.trim() || 'sch_db';
}

export function getMongoDb() {
  return mongoose.connection.getClient().db(getDatabaseName());
}

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI ;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }
  const dbName = process.env.MONGODB_NAME?.trim();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri,{ dbName });
  console.log(`[DB] Connected to MongoDB: ${mongoose.connection.name}`);
  return mongoose.connection;
}
