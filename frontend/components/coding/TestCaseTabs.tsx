import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: 'pending' | 'correct' | 'wrong';
  errorMessage?: string;
}

interface TestCaseTabsProps {
  testCases: TestCase[];
  activeCase: number;
  onTabChange: (index: number) => void;
}

const TestCaseTabs: React.FC<TestCaseTabsProps> = ({ 
  testCases, 
  activeCase, 
  onTabChange 
}) => {
  const [focusedTab, setFocusedTab] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % testCases.length;
      onTabChange(nextIndex);
      setFocusedTab(nextIndex);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (index - 1 + testCases.length) % testCases.length;
      onTabChange(prevIndex);
      setFocusedTab(prevIndex);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {testCases.map((testCase, index) => (
        <button
          key={testCase.id}
          className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 ${
            activeCase === index
              ? 'bg-teal-600/20 border-teal-500 text-teal-400'
              : 'bg-gray-800/50 border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => onTabChange(index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          tabIndex={0}
          aria-selected={activeCase === index}
        >
          Case {index + 1}
        </button>
      ))}
      <button
        className="ml-2 px-3 py-2 text-sm font-medium rounded-t-md bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center"
        aria-label="View additional cases"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default TestCaseTabs;