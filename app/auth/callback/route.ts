import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to saved location or default to /analyze
  const redirectTo =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('redirectAfterLogin') || '/analyze'
      : '/analyze';

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
