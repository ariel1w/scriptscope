import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new NextResponse('Missing email parameter.', { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('email_subscribers')
    .delete()
    .eq('email', email.toLowerCase().trim());

  if (error) {
    console.error('[Unsubscribe] Error:', error);
    return new NextResponse('Failed to unsubscribe. Please try again or contact support.', {
      status: 500,
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed - ScriptScope</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; padding: 48px 40px; text-align: center; max-width: 420px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { color: #0a1628; font-size: 24px; margin: 0 0 12px; }
    p { color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
    a { color: #c9a962; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 16px;">👋</div>
    <h1>You've been unsubscribed</h1>
    <p><strong>${email}</strong> has been removed from our launch list. You won't receive any more emails from us.</p>
    <a href="https://scriptscope.online">Return to ScriptScope</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
