'use client';

import { useState, useEffect } from 'react';
import { Code, Maximize2, ChevronUp } from 'lucide-react';
import { Language } from '@/lib/types/editor';
import { CODE_TEMPLATES } from '@/lib/constants/codeTemplates';
import LanguageSelector from './LanguageSelector';
import CodeEditor from './CodeEditor';

interface CodeEditorPanelProps {
  initialCode?: string;
  language?: Language;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: Language) => void;
  readOnly?: boolean;
}

export default function CodeEditorPanel({
  initialCode,
  language: initialLanguage = 'javascript',
  onCodeChange,
  onLanguageChange,
  readOnly = false,
}: CodeEditorPanelProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState<string>(
    initialCode || CODE_TEMPLATES[initialLanguage]
  );
  const [autoComplete, setAutoComplete] = useState(true);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(CODE_TEMPLATES[newLanguage]);
    setIsSaved(false);
    onLanguageChange?.(newLanguage);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setIsSaved(false);
    onCodeChange?.(newCode);

    setTimeout(() => {
      setIsSaved(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1e35] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a2d4a] border-b border-[#2a3f5f]">
        <div className="flex items-center gap-2">
          <Code size={18} className="text-blue-400" />
          <h2 className="text-white font-semibold">Code</h2>
        </div>
        <div className="flex items-center gap-3">
          <Maximize2 size={16} className="text-gray-400 cursor-pointer hover:text-white transition-colors" />
          <ChevronUp size={16} className="text-gray-400 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-[#0f1e35] border-b border-[#1a2d4a]">
        <LanguageSelector
          selectedLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-300">Auto Complete</span>
            <button
              onClick={() => setAutoComplete(!autoComplete)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoComplete ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoComplete ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
          <button className="p-1.5 hover:bg-[#1a2d4a] rounded transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-gray-400"
            >
              <path
                d="M13 8a5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeEditor
          code={code}
          language={language}
          onChange={handleCodeChange}
          readOnly={readOnly}
        />
      </div>

      <div className="px-4 py-2 bg-[#0f1e35] border-t border-[#1a2d4a]">
        <span className="text-xs text-gray-400">
          {isSaved ? 'Saved' : 'Saving...'}
        </span>
      </div>
    </div>
  );
}
