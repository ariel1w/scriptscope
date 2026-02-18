/**
 * One-time script to generate an initial batch of blog posts with AI persona comments.
 * Run from the project root: node scripts/generate-posts-now.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ── Load .env.local ───────────────────────────────────────────────────────────
const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars. Check .env.local');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Blog topics ───────────────────────────────────────────────────────────────
const BLOG_TOPICS = [
  'character arc mistakes that kill scripts',
  'how to write dialogue that sounds natural',
  'screenplay structure beyond three acts',
  'showing vs telling in screenwriting',
  'writing compelling antagonists',
  'first 10 pages screenplay mistakes',
  'subtext in dialogue examples',
  'how to write action lines that directors love',
  'screenplay format mistakes that scream amateur',
  'writing believable character motivations',
  'screenplay pacing techniques',
  'how to write a logline that sells',
  'avoiding cliche character types',
  'screenplay theme and how to weave it',
  'writing memorable opening scenes',
];

const LENGTH_TYPES = [
  { min: 200, max: 300, style: 'quick tips' },
  { min: 400, max: 500, style: 'medium post' },
  { min: 700, max: 800, style: 'deep-dive' },
];

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Generate one blog post ────────────────────────────────────────────────────
// Returns { id, title, slug, content }
async function generateBlogPost(topic) {
  const lengthType = LENGTH_TYPES[Math.floor(Math.random() * LENGTH_TYPES.length)];
  console.log(`  Topic: "${topic}" (${lengthType.style})`);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Write a screenwriting blog post about: ${topic}

Requirements:
- ${lengthType.min}-${lengthType.max} words (${lengthType.style})
- SEO-optimized title (include the main keyword)
- Meta description (150 chars max, compelling)
- Natural, human tone — NO AI phrases like "let's dive in", "it's important to note", "in conclusion", "delve into", "landscape of"
- Vary style: sometimes start with a question, bold statement, or story
- Short paragraphs (2-4 sentences max)
- Include practical examples from real screenplays where possible
- Be opinionated but fair — write like a working screenwriter, not a teacher
- Include 3-5 H2 headings that break up the content
- End with something actionable, not a generic conclusion
- SEO keywords (5-8 relevant terms)

Format as JSON:
{
  "title": "SEO-optimized title here",
  "content": "Full article with ## for H2 headings",
  "meta_description": "Compelling 150-char description",
  "seo_keywords": ["keyword1", "keyword2"]
}`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in blog generation response');

  const article = JSON.parse(jsonMatch[0]);
  const slug = generateSlug(article.title);
  const wordCount = article.content.split(/\s+/).length;

  const { data, error } = await supabase.from('content_queue').insert({
    platform: 'blog',
    title: article.title,
    content: article.content,
    slug,
    status: 'posted',
    posted_at: new Date().toISOString(),
    meta_description: article.meta_description,
    seo_keywords: article.seo_keywords,
    word_count: wordCount,
  }).select('id, title, slug').single();

  if (error) throw error;

  console.log(`  ✓ Saved: "${data.title}"`);
  console.log(`    URL: /blog/${data.slug}`);
  return { ...data, content: article.content };
}

// ── Generate comments for a post ──────────────────────────────────────────────
const RANDOM_NAMES = ['Mike', 'Lisa', 'John', 'Amy', 'Steve', 'Rachel', 'Tom', 'Nina', 'Brad', 'Kelly'];

function applyStyle(text, style) {
  let result = text;
  if (style?.lowercase) {
    result = result.toLowerCase();
    result = result.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }
  if (style?.mistakes && Math.random() > 0.7) {
    const typos = { the: 'teh', really: 'realy', definitely: 'definately' };
    for (const [correct, typo] of Object.entries(typos)) {
      if (Math.random() > 0.8) result = result.replace(new RegExp(`\\b${correct}\\b`, 'i'), typo);
    }
  }
  return result;
}

async function generateCommentsForPost(postId, postTitle, postContent) {
  const { data: personas, error } = await supabase
    .from('ai_personas')
    .select('*')
    .eq('is_randomizer', false);

  if (error || !personas?.length) {
    console.error('  ✗ No AI personas found — run the blog_comments migration first.');
    return 0;
  }

  const numComments = Math.floor(Math.random() * 3) + 2; // 2-4
  const selected = personas.sort(() => Math.random() - 0.5).slice(0, numComments);

  const personalityPrompts = {
    casual:    "You're a casual commenter. Keep it short (1-3 sentences). Reference your own experience vaguely.",
    formal:    "You're formal and thoughtful. Write 2-4 sentences. Reference specific points. Sometimes politely disagree.",
    technical: "You're a technical screenwriter. Reference industry terms or structural elements. Be precise (3-5 sentences).",
    balanced:  "You're balanced. Mix casual and formal. Add your own perspective. 2-4 sentences.",
    friendly:  "You're supportive. Share how the article helped you. Ask a follow-up question. 2-3 sentences.",
    skeptical: "You're skeptical but fair. Point out exceptions or alternative viewpoints. 3-4 sentences.",
  };

  for (const persona of selected) {
    const delay = Math.random() * 48 * 60 * 60 * 1000; // spread over 48h
    const commentDate = new Date(Date.now() + delay);
    const prompt = personalityPrompts[persona.personality] ?? personalityPrompts.balanced;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are ${persona.name}, commenting on the blog post: "${postTitle}"

${prompt}

Article excerpt:
${postContent.substring(0, 600)}

Write a natural human comment. NO generic AI phrases like "great insights" or "thanks for sharing". Be specific to the article. Sound like a real person having a conversation.

Respond with ONLY the comment text.`,
      }],
    });

    let commentText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    commentText = commentText.replace(/^["']|["']$/g, '').trim();
    commentText = applyStyle(commentText, persona.writing_style);

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: commentText,
      created_at: commentDate.toISOString(),
    });
  }

  // 40% chance of an extra randomizer comment
  let total = selected.length;
  if (Math.random() > 0.6) {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const delay = Math.random() * 72 * 60 * 60 * 1000;
    const commentDate = new Date(Date.now() + delay);

    const styles = [
      'Write 1 short casual sentence.',
      'Write 2-3 sentences. Share a quick personal story.',
      'Write 1 sentence asking a specific question.',
      'Write 2 sentences politely disagreeing with one point.',
    ];

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are ${name}, a casual visitor commenting on: "${postTitle}"
${styles[Math.floor(Math.random() * styles.length)]}
Article excerpt: ${postContent.substring(0, 300)}
Respond with ONLY the comment text.`,
      }],
    });

    let text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    text = text.replace(/^["']|["']$/g, '').trim();
    if (Math.random() > 0.5) text = text.toLowerCase();

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: null,
      author_name: name,
      content: text,
      created_at: commentDate.toISOString(),
    });
    total++;
  }

  console.log(`  ✓ ${total} comments generated`);
  return total;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const NUM_POSTS = 3;
const topics = [...BLOG_TOPICS].sort(() => Math.random() - 0.5).slice(0, NUM_POSTS);

console.log(`\n=== Generating ${NUM_POSTS} blog posts with comments ===\n`);

for (let i = 0; i < NUM_POSTS; i++) {
  console.log(`[${i + 1}/${NUM_POSTS}] Generating post...`);
  try {
    const post = await generateBlogPost(topics[i]);
    console.log(`  Generating AI persona comments...`);
    await generateCommentsForPost(post.id, post.title, post.content);
  } catch (err) {
    console.error(`  ✗ Error:`, err.message);
  }

  if (i < NUM_POSTS - 1) {
    process.stdout.write('  Pausing 2s...\n\n');
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log('\n=== Done! ===\n');
