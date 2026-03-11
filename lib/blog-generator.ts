import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Screenwriting topics that real screenwriters search for
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
  'screenplay conflict techniques',
  'how to write visual storytelling',
  'dialogue tags and action beats',
  'screenplay revision checklist',
  'character voice consistency',
  'writing B-plots that enhance your story',
  'scene transitions in screenplays',
  'writing emotional scenes without melodrama',
  'screenplay economy of words',
  'how professional readers evaluate scripts',
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function generateBlogPost(): Promise<void> {
  // Pick a random topic
  const topic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];

  // Vary article length
  const lengthTypes = [
    { min: 200, max: 300, style: 'quick tips' },
    { min: 400, max: 500, style: 'medium post' },
    { min: 700, max: 800, style: 'deep-dive' },
  ];
  const selectedLength = lengthTypes[Math.floor(Math.random() * lengthTypes.length)];

  const prompt = `Write a screenwriting blog post about: ${topic}

Requirements:
- ${selectedLength.min}-${selectedLength.max} words (${selectedLength.style})
- SEO-optimized title (include the main keyword)
- Meta description (150 chars max, compelling)
- Natural, human tone - NO AI phrases like "let's dive in", "it's important to note", "in conclusion", "delve into", "landscape of", "realm of"
- NEVER use em dashes (—) or en dashes (–). Use commas, periods, or separate sentences instead.
- Vary your writing style - sometimes start with a question, sometimes with a bold statement, sometimes with a story
- Use short paragraphs (2-4 sentences max)
- Include practical examples from real screenplays where possible
- Be opinionated but fair
- Write like a working screenwriter, not a teacher
- Include 3-5 H2 headings that break up the content
- End with something actionable, not a generic conclusion
- SEO keywords (5-8 relevant terms)

Format your response as JSON:
{
  "title": "SEO-optimized title here",
  "content": "Full article content with ## for H2 headings and regular paragraphs",
  "meta_description": "Compelling 150-char description",
  "seo_keywords": ["keyword1", "keyword2", ...]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No JSON found in blog generation response');
  }

  const article = JSON.parse(jsonMatch[0]);

  // Strip any em/en dashes the model produced despite instructions
  function replaceDashes(s: string): string {
    if (!s) return s;
    return s.replace(/\n *[—–] */g, '\n- ').replace(/ *[—–] */g, ', ');
  }
  article.title = replaceDashes(article.title);
  article.content = replaceDashes(article.content);
  article.meta_description = replaceDashes(article.meta_description);
  const slug = generateSlug(article.title);
  const wordCount = article.content.split(/\s+/).length;

  // Insert into content_queue
  await supabaseAdmin.from('content_queue').insert({
    platform: 'blog',
    title: article.title,
    content: article.content,
    slug: slug,
    status: 'posted',
    posted_at: new Date().toISOString(),
    meta_description: article.meta_description,
    seo_keywords: article.seo_keywords,
    word_count: wordCount,
  });

  console.log(`Generated blog post: ${article.title}`);
}
