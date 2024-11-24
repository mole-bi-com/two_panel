import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const url = new URL(req.url);
  const scriptId = url.searchParams.get('id');

  if (!scriptId) {
    return NextResponse.json({ error: 'Script ID is required' }, { status: 400 });
  }

  // Fetch the script from the database
  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .select('*')
    .eq('script_id', scriptId)
    .single();

  if (scriptError) {
    console.error('Error fetching script:', scriptError);
    return NextResponse.json({ error: 'Failed to fetch script' }, { status: 500 });
  }

  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 });
  }

  // Simulate translation process
  const translatedContent = `Translated content for: ${script.original_content}`;

  return NextResponse.json({ translatedContent });
} 