import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './src/config.js';
import { User, Article, Issue } from './src/models.js';

await mongoose.connect(config.mongoUri);

// ensure admin exists
let user = await User.findOne({ email: 'admin@tnsf.gov.in' });
if (!user) {
  user = await User.create({ name: 'Journal Administrator', email: 'admin@tnsf.gov.in', passwordHash: await bcrypt.hash('Tnsfjournal1234', 12), role: 'admin' });
  console.log('admin created');
}

// ensure an issue exists
let issue = await Issue.findOne({ volume: 1, issueNumber: 1, year: 2026 });
if (!issue) {
  issue = await Issue.create({ title: 'Volume 1 Issue 1', volume: 1, issueNumber: 1, year: 2026, status: 'published', description: 'Test issue' });
  console.log('issue created');
}

// create a published article
const slug = 'read-article-test-published';
const exists = await Article.exists({ slug });
if (!exists) {
  await Article.create({
    title: 'Read Article Test — Published',
    slug,
    abstract: 'This is a published test article used to verify the read-article detail page works end to end.',
    authors: [{ name: 'Test Author', affiliation: 'Test Lab' }],
    keywords: ['test', 'read-article'],
    issue: issue._id,
    status: 'published',
    publishedAt: new Date(),
    fullText: 'Full text of the published test article.'
  });
  console.log('published article created:', slug);
} else {
  console.log('published article already exists:', slug);
}
await mongoose.disconnect();
