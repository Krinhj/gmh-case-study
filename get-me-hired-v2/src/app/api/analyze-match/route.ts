// Next.js API Route for Match Score Analysis
// Wrapper for analyze-job-match Edge Function

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

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
    const { job_application_id } = await request.json();

    if (!job_application_id) {
      return NextResponse.json(
        { error: 'job_application_id is required' },
        { status: 400 }
      );
    }

    // Verify the job application belongs to the user
    const { data: jobApp, error: jobError } = await supabase
      .from("job_applications")
      .select("id, user_id")
      .eq("id", job_application_id)
      .single();

    if (jobError || !jobApp) {
      return NextResponse.json(
        { error: "Job application not found" },
        { status: 404 }
      );
    }

    if (jobApp.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: This application does not belong to you" },
        { status: 403 }
      );
    }

    // Call Edge Function
    console.log('Calling analyze-job-match Edge Function...');
    const { data, error } = await supabase.functions.invoke('analyze-job-match', {
      body: {
        user_id: user.id,
        job_application_id,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      const errorMessage = getErrorMessage(error, 'Failed to analyze match');
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || 'Match analysis failed' },
        { status: 500 }
      );
    }

    // Return analysis results
    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error: unknown) {
    console.error('API route error:', error);
    const message = getErrorMessage(error, 'Internal server error');
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}




