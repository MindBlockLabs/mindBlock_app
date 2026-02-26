import { Language } from '../types/editor';

export const CODE_TEMPLATES: Record<Language, string> = {
  javascript: `function reverseWords(sentence) {
  // your code here
}`,
  python: `def reverse_words(sentence):
    # your code here
    pass`,
  cpp: `#include <string>
using namespace std;

string reverseWords(string sentence) {
    // your code here
}`,
  csharp: `public class Solution {
    public string ReverseWords(string sentence) {
        // your code here
    }
}`,
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  csharp: 'C#',
};

export const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  csharp: 'csharp',
};
