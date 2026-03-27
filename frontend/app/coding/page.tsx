'use client';

import { useState } from 'react';
import CodeEditorPanel from '@/components/coding/CodeEditorPanel';
import { Language } from '@/lib/types/editor';

export default function CodingPage() {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<Language>('javascript');

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    console.log('Code updated:', newCode);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    console.log('Language changed to:', newLanguage);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950">
      <div className="h-screen flex flex-col p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">Code Challenge</h1>
          <p className="text-slate-400">Write your solution below</p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <CodeEditorPanel
            initialCode={code || undefined}
            language={language}
            onCodeChange={handleCodeChange}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Submit
          </button>
          <button className="px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
