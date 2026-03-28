import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TestCaseHeaderProps {
  expanded: boolean;
  toggleExpanded: () => void;
}

const TestCaseHeader: React.FC<TestCaseHeaderProps> = ({ 
  expanded, 
  toggleExpanded 
}) => {
  return (
    <div 
      className="flex justify-between items-center p-3 bg-gray-800 cursor-pointer hover:bg-gray-750 transition-colors"
      onClick={toggleExpanded}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleExpanded();
        }
      }}
    >
      <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">
        Testcase
      </h3>
      <button 
        className="text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-label={expanded ? 'Collapse testcase panel' : 'Expand testcase panel'}
      >
        {expanded ? (
          <ChevronUp size={20} />
        ) : (
          <ChevronDown size={20} />
        )}
      </button>
    </div>
  );
};

export default TestCaseHeader;