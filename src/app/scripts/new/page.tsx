'use client'

import NewScriptForm from '@/components/new-script-form';

export default function NewScriptPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Translation</h1>
      <NewScriptForm />
    </div>
  );
} 