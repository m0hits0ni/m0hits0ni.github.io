#!/usr/bin/env node
/*
 * Pull your latest Medium posts into content/medium-feed.js.
 *
 *   node scripts/sync-medium.mjs              # reads the handle from content/posts.js
 *   node scripts/sync-medium.mjs @your-handle # or pass it explicitly
 *
 * Medium's RSS feed only carries your ten most recent stories, so this merges
 * instead of replacing: posts seen before stay in the file, new ones are added,
 * edited ones are updated. The file is only rewritten when something changed.
 *
 * No dependencies. Needs Node 18+ (global fetch).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_FILE = path.join(ROOT, 'content', 'posts.js');
const FEED_FILE = path.join(ROOT, 'content', 'medium-feed.js');
const TIME_ZONE = 'Asia/Kolkata'; // post dates are shown as the day they went out in IST
const WORDS_PER_MINUTE = 238;
const MIN_WORDS = 80; // Medium's feed also carries short responses (comments); skip those

// Medium tags arrive as lowercase slugs ("system-design", "aws-emr"); these words keep their real casing.
const WORD_CASE = Object.fromEntries([
  'AI', 'API', 'APIs', 'AWS', 'EMR', 'EKS', 'EC2', 'S3', 'GPU', 'ML', 'NLP', 'LLM', 'LLMs', 'GenAI', 'SQL', 'NoSQL',
  'KYC', 'CKYC', 'OCR', 'UPI', 'NBFC', 'NBFCs', 'RBI', 'DPDP', 'IDOR', 'EMI', 'JWT', 'OAuth', 'OAuth2', 'HTTP', 'REST',
  'JSON', 'CI', 'CD', 'UI', 'UX', 'SDK', 'SaaS', 'B2B', 'iOS', 'DevOps', 'PostgreSQL', 'Postgres', 'RabbitMQ',
  'MySQL', 'MongoDB', 'Redis', 'Django', 'DRF', 'Celery', 'Python', 'Kubernetes', 'Docker', 'JavaScript',
  'TypeScript', 'GitHub', 'GitLab', 'Claude', 'Cursor',
].map((word) => [word.toLowerCase(), word]));

/* ---------- helpers ---------- */

// Evaluate a browser-style data file (`window.X = {...}`) in a sandbox and return its `window`.
async function loadWindowFile(file) {
  try {
    const code = await readFile(file, 'utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(code, sandbox, { filename: file, timeout: 1000 });
    return sandbox.window;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

function resolveFeed(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  let match = raw.match(/^https?:\/\/(?:www\.)?medium\.com\/(@[\w.-]+)/i);
  if (match) return { handle: match[1], url: `https://medium.com/feed/${match[1]}` };
  match = raw.match(/^https?:\/\/([\w-]+)\.medium\.com/i);
  if (match) return { handle: `https://${match[1]}.medium.com`, url: `https://${match[1]}.medium.com/feed` };
  match = raw.match(/^@?([\w.-]+)$/);
  if (match) return { handle: `@${match[1]}`, url: `https://medium.com/feed/@${match[1]}` };
  if (/^https?:\/\//i.test(raw)) {
    const origin = new URL(raw).origin; // a publication on its own domain
    return { handle: origin, url: `${origin}/feed` };
  }
  return null;
}

const decodeEntities = (text) => text
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&amp;/g, '&');

const unwrap = (value) => {
  const trimmed = value.trim();
  const cdata = trimmed.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : decodeEntities(trimmed);
};

const pattern = (name, flags = '') => new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, flags);
const first = (xml, name) => { const m = xml.match(pattern(name)); return m ? unwrap(m[1]) : ''; };
const all = (xml, name) => [...xml.matchAll(pattern(name, 'g'))].map((m) => unwrap(m[1]));

const INLINE_TAGS = /<\/?(?:a|b|strong|em|i|u|s|code|span|mark|sub|sup|br)\b[^>]*>/gi;

const htmlToText = (html) => decodeEntities(
  html
    .replace(/<(script|style|figcaption)[\s\S]*?<\/\1>/gi, ' ')
    .replace(INLINE_TAGS, '') // inline formatting joins words, it doesn't separate them
    .replace(/<[^>]+>/g, ' ')
)
  .replace(/\s+/g, ' ')
  .replace(/\s+([.,;:!?])(?=\s|$)/g, '$1')
  .trim();

function summarize(html, max = 220) {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => htmlToText(m[1]))
    .filter((text) => text.length >= 60 && !/^by\s/i.test(text)); // skip bylines
  const text = paragraphs[0] || htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–—-]+$/, '')}…`;
}

const prettyTag = (tag) => tag
  .toLowerCase()
  .split(/[-\s]+/)
  .filter(Boolean)
  .map((word, index) => WORD_CASE[word] || (index === 0 ? word[0].toUpperCase() + word.slice(1) : word))
  .join(' ');

const dayIn = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

function toPost(item) {
  const html = first(item, 'content:encoded') || first(item, 'description');
  const words = htmlToText(html).split(' ').filter(Boolean).length;
  const link = first(item, 'link').split('?')[0];
  const guid = first(item, 'guid');
  const id = (guid.match(/\/p\/([0-9a-f]+)/i) || link.match(/[-/]([0-9a-f]{10,16})\/?$/i) || [])[1] || link;
  const published = new Date(first(item, 'pubDate'));
  const image = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)]
    .map((m) => m[1])
    .find((src) => /^https:\/\//.test(src) && !src.includes('/_/stat'));

  return {
    id,
    title: htmlToText(first(item, 'title')),
    url: link,
    date: Number.isNaN(published.getTime()) ? '' : dayIn(published),
    summary: summarize(html),
    tags: all(item, 'category').slice(0, 5).map(prettyTag),
    readTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    ...(image ? { image } : {}),
    words,
  };
}

/* ---------- main ---------- */

const writing = (await loadWindowFile(POSTS_FILE)).WRITING || {};
const feed = resolveFeed(process.argv[2] || process.env.MEDIUM_HANDLE || writing.medium);

if (!feed) {
  console.log('No Medium handle set. Add it as `medium` in content/posts.js (for example "@your-handle"). Nothing to sync.');
  process.exit(0);
}

let xml;
try {
  const response = await fetch(feed.url, { headers: { 'user-agent': 'portfolio-medium-sync/1.0 (+https://github.com/m0hits0ni)' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  xml = await response.text();
} catch (error) {
  console.error(`Couldn't fetch ${feed.url}: ${error.message}`);
  process.exit(1);
}

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => toPost(m[1]));
const fresh = items.filter((post) => post.title && post.url && post.date && post.words >= MIN_WORDS);
const skipped = items.length - fresh.length;

const existing = (await loadWindowFile(FEED_FILE)).MEDIUM_FEED || {};
const sameHandle = existing.handle === feed.handle;
const byId = new Map((sameHandle && Array.isArray(existing.posts) ? existing.posts : []).map((post) => [post.id, post]));

let added = 0;
let updated = 0;
for (const { words, ...post } of fresh) {
  const before = byId.get(post.id);
  if (!before) added += 1;
  else if (JSON.stringify(before) !== JSON.stringify(post)) updated += 1;
  byId.set(post.id, post);
}

const posts = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
const changed = !sameHandle || added > 0 || updated > 0;

if (!changed) {
  console.log(`Medium ${feed.handle}: no new or edited posts (${posts.length} on file).`);
  process.exit(0);
}

const data = { handle: feed.handle, syncedAt: new Date().toISOString(), posts };
const output = [
  "// Generated by scripts/sync-medium.mjs. Don't edit by hand: the next sync overwrites it.",
  '// Hand-written entries belong in content/posts.js.',
  `window.MEDIUM_FEED = ${JSON.stringify(data, null, 2)};`,
  '',
].join('\n');

await writeFile(FEED_FILE, output, 'utf8');
console.log(`Medium ${feed.handle}: ${added} new, ${updated} updated, ${posts.length} on file${skipped ? ` (skipped ${skipped} short responses)` : ''}.`);
