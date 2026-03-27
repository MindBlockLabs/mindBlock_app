export type Language = 'javascript' | 'python' | 'cpp' | 'csharp';

export interface EditorState {
  code: string;
  language: Language;
}

export interface CodeEditorProps {
  initialCode?: string;
  language?: Language;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: Language) => void;
  readOnly?: boolean;
}

export interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}
