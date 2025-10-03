// Next.js API Route for Resume Parsing
// Wrapper for parse-resume Edge Function

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Create Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get request body
    const { file_url } = await request.json();

    if (!file_url) {
      return NextResponse.json(
        { error: 'file_url is required' },
        { status: 400 }
      );
    }

    // Call Edge Function
    console.log('Calling parse-resume Edge Function...');
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: {
        file_url,
        user_id: user.id,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to parse resume' },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Resume parsing failed' },
        { status: 500 }
      );
    }

    // Return parsed data
    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
