import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Check if this is an email confirmation (signup) or OAuth login
  // Email confirmations have type=signup in Supabase
  if (type === 'signup') {
    // Redirect to confirmation page for email verification
    return NextResponse.redirect(new URL('/auth/confirm', request.url));
  }

  // For OAuth logins, redirect directly to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
