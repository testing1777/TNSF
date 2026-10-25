import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'reviewer'], default: 'editor' },
  active: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true });

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 240 },
  volume: { type: Number, required: true, min: 1 },
  issueNumber: { type: Number, required: true, min: 1 },
  year: { type: Number, required: true, min: 1900, max: 2200 },
  publishedAt: Date,
  coverImageUrl: String,
  description: { type: String, maxlength: 3000 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: true });
issueSchema.index({ volume: 1, issueNumber: 1, year: 1 }, { unique: true });

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  abstract: { type: String, required: true, maxlength: 10000 },
  authors: [{ name: { type: String, required: true }, affiliation: String, email: String }],
  keywords: [{ type: String, trim: true, maxlength: 80 }],
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  publishedAt: Date,
  pdfUrl: String,
  doi: String,
  license: String,
  references: [{ type: String, maxlength: 1000 }],
  fullText: { type: String, select: false, maxlength: 1000000 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
articleSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

export const User = mongoose.model('User', userSchema);
export const Issue = mongoose.model('Issue', issueSchema);
export const Article = mongoose.model('Article', articleSchema);
