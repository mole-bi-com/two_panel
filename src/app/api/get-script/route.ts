import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scriptId = searchParams.get('id');

  if (!scriptId) {
    return NextResponse.json({ error: 'Script ID is required' }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Fetch script data
  const { data: scriptData, error: scriptError } = await supabase.from('scripts').select('*').eq('id', scriptId).single();

  if (scriptError) {
    console.error('Error fetching script:', scriptError);
    return NextResponse.json({ error: 'Failed to fetch script' }, { status: 500 });
  }

  return NextResponse.json(scriptData);
} 