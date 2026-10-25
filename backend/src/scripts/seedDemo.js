import mongoose from 'mongoose';
import { config } from '../config.js';
import { Article, Issue } from '../models.js';
await mongoose.connect(config.mongoUri);
const issue = await Issue.findOneAndUpdate(
  { volume: 1, issueNumber: 1, year: 2026 },
  { title: 'Demonstration Issue — Replace Before Launch', volume: 1, issueNumber: 1, year: 2026, status: 'draft', description: 'Demo-only placeholder. Replace with verified, authorized issue metadata.' },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const exists = await Article.exists({slug:'demonstration-article-replace-before-launch'});
if (!exists) await Article.create({
  title:'Demonstration Article — Replace Before Launch',
  slug:'demonstration-article-replace-before-launch',
  abstract:'This is placeholder content for local testing only. Replace it with an authorized abstract before any public deployment.',
  authors:[{name:'Demo Author',affiliation:'Demo affiliation'}],
  keywords:['demo','placeholder'],
  issue:issue._id,
  status:'draft',
  fullText:'This placeholder full text exists only to test local similarity screening. It is not a real scientific article.'
});
console.log('Demo draft created; it is not publicly visible.');
await mongoose.disconnect();
