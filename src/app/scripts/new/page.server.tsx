import NewScriptForm from '@/components/new-script-form';
import TranslateForm from '@/components/translate-form';
import { createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export default async function NewScriptPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();

  // Fetch script data
  const { data: scriptData, error: scriptError } = await supabase.from('scripts').select('*').eq('id', params.id).single();

  if (scriptError) {
    console.error('Error fetching script:', scriptError);
    return <div>Error fetching script</div>;
  }

  if (!scriptData) {
    console.error('Script not found for id:', params.id);
    return <div>Script not found</div>;
  }

  // Fetch translation data
  const { data: translationData, error: translationError } = await supabase.from('translations').select('*').eq('script_id', scriptData.id).single();

  if (translationError) {
    console.error('Translation error:', translationError);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">새 스크립트 생성</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">스크립트 내용</h2>
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">{scriptData.content}</pre>
          <TranslateForm scriptId={scriptData.id} />
        </div>
      </div>
    </main>
  );
} 