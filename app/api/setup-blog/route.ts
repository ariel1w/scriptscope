import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    if (secret !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert AI personas directly using Supabase client
    const personas = [
      { name: 'Script Doctor', username: 'scriptdoctor', avatar: 'SD', bg: '1E3A5F', color: 'c9a962', personality: 'formal', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Sarah Martinez', username: 'sarahwrites', avatar: 'SM', bg: 'e91e63', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Dr. Michael Chen', username: 'mchenphd', avatar: 'MC', bg: '3f51b5', personality: 'formal', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Jamie K', username: 'jamiek_writer', avatar: 'JK', bg: 'ff9800', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Robert Thompson', username: 'robthompson', avatar: 'RT', bg: '4caf50', personality: 'balanced', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'alexia_rose', username: 'alexia_rose', avatar: 'AR', bg: '9c27b0', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'David Park', username: 'davidpark', avatar: 'DP', bg: '00bcd4', personality: 'technical', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Emma Wilson', username: 'emmawilson', avatar: 'EW', bg: 'f44336', personality: 'friendly', style: { lowercase: false, slang: false, detailed: false, mistakes: false } },
      { name: 'tyler_m', username: 'tyler_m', avatar: 'TM', bg: '607d8b', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Patricia Rodriguez', username: 'pat_rodriguez', avatar: 'PR', bg: 'ff5722', personality: 'formal', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Chris Anderson', username: 'chrisanderson', avatar: 'CA', bg: '795548', personality: 'skeptical', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
    ];

    const personasToInsert = personas.map((p: any) => ({
      username: p.username,
      name: p.name,
      avatar_url: `https://ui-avatars.com/api/?name=${p.avatar}&background=${p.bg}&color=${p.color ?? 'fff'}`,
      personality: p.personality,
      writing_style: p.style,
      is_randomizer: false,
    }));

    const { error } = await supabaseAdmin.from('ai_personas').upsert(personasToInsert, {
      onConflict: 'username',
      ignoreDuplicates: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Blog system setup complete', personas: personas.length });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
