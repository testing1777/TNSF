import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:5173',
  adminSiteUrl: process.env.ADMIN_SITE_URL || 'http://localhost:5174',
  trustProxy: process.env.TRUST_PROXY === 'true',
};
if (!config.mongoUri) throw new Error('MONGODB_URI is required');
if (!config.jwtSecret || config.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
