import { ChevronDown } from 'lucide-react';
import { Language } from '@/lib/types/editor';
import { LANGUAGE_LABELS } from '@/lib/constants/codeTemplates';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages: Language[] = ['javascript', 'python', 'cpp', 'csharp'];

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="appearance-none bg-[#1e3a5f] text-white px-4 py-2 pr-10 rounded-md cursor-pointer hover:bg-[#2a4770] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white"
        size={16}
      />
    </div>
  );
}
