'use client'

import NewScriptForm from '@/components/new-script-form';
import TranslateForm from '@/components/translate-form';

const NewScriptPage = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">새 스크립트 생성</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <NewScriptForm />
        </div>
      </div>
    </main>
  );
}

export default NewScriptPage; 