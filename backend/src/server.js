import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from './config.js';
import { Article, Issue, User } from './models.js';
import { requireAuth, requireRole } from './middleware.js';
import { screenText } from './screening.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet());
const origins = [config.publicSiteUrl, config.adminSiteUrl].filter(Boolean);
app.use(cors({ origin(origin, cb) { if (!origin || origins.includes(origin)) return cb(null, true); return cb(new Error('Origin not allowed by CORS')); } }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/auth/login', rateLimit({
  windowMs: 15*60*1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req,res) => res.status(429).json({ error:'Too many login attempts. Please try again in 15 minutes.' })
}));

app.get('/', (req,res)=>res.json({ status:'ok', service:'tnsf-ejournal-api', api:'/api' }));
app.get('/api', (req,res)=>res.json({
  status:'ok',
  service:'tnsf-ejournal-api',
  version:'1.0.0',
  routes:[
    'GET /api/health','GET /api/articles','GET /api/articles/:slug','GET /api/issues',
    'POST /api/auth/login','GET /api/auth/me',
    'GET /api/admin/articles','POST /api/admin/articles','PATCH /api/admin/articles/:id','DELETE /api/admin/articles/:id',
    'POST /api/admin/issues','POST /api/screening/check'
  ]
}));
app.get('/api/health', (req,res)=>res.json({ status:'ok', service:'tnsf-ejournal-api', time:new Date().toISOString() }));

app.post('/api/auth/login', async (req,res,next) => {
  try {
    const parsed = z.object({ email:z.string().email().max(254), password:z.string().min(1).max(200) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error:'Valid email and password are required' });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), active:true });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error:'Invalid email or password' });
    user.lastLoginAt = new Date(); await user.save();
    const token = jwt.sign({ sub:String(user._id), role:user.role }, config.jwtSecret, { expiresIn:config.jwtExpiresIn, issuer:'tnsf-ejournal-api', audience:'tnsf-ejournal' });
    res.json({ token, user:{ id:String(user._id), name:user.name, email:user.email, role:user.role } });
  } catch(e) { next(e); }
});
app.get('/api/auth/me', requireAuth, (req,res)=>res.json({ user:req.user }));

app.get('/api/articles', async (req,res,next) => {
  try {
    const page = Math.max(1, Math.min(10000, Number(req.query.page)||1));
    const limit = Math.max(1, Math.min(50, Number(req.query.limit)||12));
    const filter = { status:'published' };
    if (req.query.q) filter.$text = { $search:String(req.query.q).slice(0,100) };
    if (req.query.year && /^\d{4}$/.test(String(req.query.year))) {
      const start = new Date(`${req.query.year}-01-01T00:00:00Z`), end = new Date(`${Number(req.query.year)+1}-01-01T00:00:00Z`);
      filter.publishedAt = { $gte:start, $lt:end };
    }
    const [items,total] = await Promise.all([
      Article.find(filter).select('-fullText').populate({path:'issue',select:'title volume issueNumber year'}).sort({publishedAt:-1,_id:-1}).skip((page-1)*limit).limit(limit).lean(),
      Article.countDocuments(filter)
    ]);
    res.json({ items, page, limit, total, pages:Math.ceil(total/limit) });
  } catch(e) { next(e); }
});
app.get('/api/articles/:slug', async (req,res,next) => {
  try {
    const article = await Article.findOne({ slug:req.params.slug, status:'published' }).select('-fullText').populate('issue').lean();
    if (!article) return res.status(404).json({ error:'Article not found' });
    res.json({ article });
  } catch(e) { next(e); }
});
app.get('/api/issues', async (req,res,next) => {
  try { res.json({ items:await Issue.find({status:'published'}).sort({year:-1,volume:-1,issueNumber:-1}).lean() }); } catch(e) { next(e); }
});

app.get('/api/admin/articles', requireAuth, requireRole('admin','editor'), async (req,res,next) => {
  try {
    const items = await Article.find().select('-fullText').populate('issue','title volume issueNumber year').sort({updatedAt:-1}).limit(200).lean();
    res.json({ items });
  } catch(e) { next(e); }
});
const articleSchema = z.object({
  title:z.string().trim().min(4).max(300),
  slug:z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  abstract:z.string().trim().min(20).max(10000),
  authors:z.array(z.object({name:z.string().trim().min(2).max(120), affiliation:z.string().max(250).optional().default(''), email:z.union([z.string().email(),z.literal('')]).optional().default('')})).min(1).max(30),
  keywords:z.array(z.string().trim().min(1).max(80)).max(30).optional().default([]),
  issue:z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  publishedAt:z.string().optional().nullable(),
  pdfUrl:z.string().url().optional().or(z.literal('')).nullable(),
  doi:z.string().max(200).optional().or(z.literal('')),
  license:z.string().max(200).optional().or(z.literal('')),
  references:z.array(z.string().max(1000)).max(300).optional().default([]),
  fullText:z.string().max(1000000).optional().default(''),
  status:z.enum(['draft','published','archived']).optional().default('draft')
});
app.post('/api/admin/articles', requireAuth, requireRole('admin','editor'), async (req,res,next) => {
  try {
    const parsed=articleSchema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error:'Invalid article data',details:parsed.error.issues});
    if(await Article.exists({slug:parsed.data.slug})) return res.status(409).json({error:'Slug already exists'});
    const data={...parsed.data, issue:parsed.data.issue||null, publishedAt:parsed.data.status==='published'?(parsed.data.publishedAt?new Date(parsed.data.publishedAt):new Date()):null, createdBy:req.user._id};
    const article=await Article.create(data);
    res.status(201).json({article:await Article.findById(article._id).select('-fullText').lean()});
  } catch(e) { next(e); }
});
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
app.patch('/api/admin/articles/:id', requireAuth, requireRole('admin','editor'), async (req,res,next) => {
  try {
    if (!objectId.safeParse(req.params.id).success) return res.status(400).json({error:'Invalid article id'});
    const parsed=articleSchema.partial().safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error:'Invalid article data',details:parsed.error.issues});
    const data={...parsed.data};
    if(data.status==='published'&&!data.publishedAt) data.publishedAt=new Date();
    if(data.issue==='') data.issue=null;
    const article=await Article.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true}).select('-fullText').lean();
    if(!article) return res.status(404).json({error:'Article not found'});
    res.json({article});
  } catch(e) { next(e); }
});
app.delete('/api/admin/articles/:id', requireAuth, requireRole('admin'), async (req,res,next) => {
  try {
    if (!objectId.safeParse(req.params.id).success) return res.status(400).json({error:'Invalid article id'});
    const item=await Article.findByIdAndDelete(req.params.id); if(!item) return res.status(404).json({error:'Article not found'}); res.status(204).end();
  } catch(e) { next(e); }
});
app.post('/api/admin/issues', requireAuth, requireRole('admin','editor'), async (req,res,next) => {
  try {
    const parsed=z.object({title:z.string().min(3).max(240),volume:z.number().int().min(1),issueNumber:z.number().int().min(1),year:z.number().int().min(1900).max(2200),publishedAt:z.string().optional().nullable(),coverImageUrl:z.string().url().optional().or(z.literal('')),description:z.string().max(3000).optional(),status:z.enum(['draft','published','archived']).optional()}).safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error:'Invalid issue data',details:parsed.error.issues});
    const issue=await Issue.create({...parsed.data,publishedAt:parsed.data.publishedAt?new Date(parsed.data.publishedAt):undefined});
    res.status(201).json({issue});
  } catch(e) { next(e); }
});
app.post('/api/screening/check', requireAuth, requireRole('admin','editor'), async (req,res,next) => {
  try {
    const parsed=z.object({text:z.string().min(1).max(1000000)}).safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error:'Provide article text up to 1,000,000 characters'});
    const corpus=await Article.find({status:'published'}).select('+fullText title slug abstract').limit(5000).lean();
    res.json(screenText(parsed.data.text,corpus));
  } catch(e) { next(e); }
});

app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.use((err,req,res,next)=>{
  if (res.headersSent) return next(err);
  if (err?.code===11000) return res.status(409).json({error:'A record with that unique value already exists'});
  if (err?.type==='entity.parse.failed') return res.status(400).json({error:'Request body must be valid JSON'});
  if (err?.name==='CastError') return res.status(400).json({error:`Invalid value for ${err.path || 'request parameter'}`});
  if (err?.name==='ValidationError') return res.status(400).json({error:'Invalid data', details:Object.values(err.errors || {}).map(item=>item.message)});
  if (err?.message==='Origin not allowed by CORS') return res.status(403).json({error:err.message});
  console.error(err);
  res.status(500).json({error:process.env.NODE_ENV==='production'?'Internal server error':(err.message||'Internal server error')});
});

try {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
} catch (err) {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
}

const server = app.listen(config.port,()=>console.log(`API listening on ${config.port}`));
server.on('error', (err) => {
  if (err.code==='EADDRINUSE') console.error(`Port ${config.port} is already in use. Stop the other process or set PORT to a different value.`);
  else console.error('Server error:', err);
  process.exit(1);
});

for (const signal of ['SIGINT','SIGTERM']) {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  });
}
