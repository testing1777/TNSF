import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../../src/config.js';
import { User } from '../../src/models.js';
const email=(process.env.ADMIN_EMAIL||'').toLowerCase().trim();
const password=process.env.ADMIN_PASSWORD||'';
const name=process.env.ADMIN_NAME||'Journal Administrator';
if(!email || !password || password.length<14) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) in backend/.env'); process.exit(1);
}
await mongoose.connect(config.mongoUri);
const existing=await User.findOne({email});
if(existing) console.log(`User already exists: ${email}; no changes made.`);
else {
  const passwordHash=await bcrypt.hash(password,12);
  await User.create({name,email,passwordHash,role:'admin'});
  console.log(`Administrator created: ${email}`);
}
await mongoose.disconnect();
