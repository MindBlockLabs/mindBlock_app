import React, { useState } from 'react';
import TestCaseHeader from './TestCaseHeader';
import TestCaseTabs from './TestCaseTabs';
import OutputDisplay from './OutputDisplay';
import ValidationStatus from './ValidationStatus';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: 'pending' | 'correct' | 'wrong';
  errorMessage?: string;
}

interface TestCasePanelProps {
  testCases: TestCase[];
  activeCase?: number;
  onTabChange?: (caseIndex: number) => void;
}

const TestCasePanel: React.FC<TestCasePanelProps> = ({ 
  testCases = [], 
  activeCase = 0, 
  onTabChange 
}) => {
  const [expanded, setExpanded] = useState(true);
  
  const activeTestCase = testCases[activeCase] || testCases[0];

  const handleTabChange = (index: number) => {
    if (onTabChange) {
      onTabChange(index);
    }
  };

  if (!expanded) {
    return (
      <div className="border border-gray-700 rounded-lg bg-gray-900 overflow-hidden">
        <TestCaseHeader 
          expanded={expanded} 
          toggleExpanded={() => setExpanded(!expanded)} 
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-900 overflow-hidden">
      <TestCaseHeader 
        expanded={expanded} 
        toggleExpanded={() => setExpanded(!expanded)} 
      />
      
      <div className="p-4">
        <TestCaseTabs 
          testCases={testCases}
          activeCase={activeCase}
          onTabChange={handleTabChange}
        />
        
        <div className="mt-4 relative">
          <OutputDisplay 
            output={activeTestCase?.actualOutput || activeTestCase?.expectedOutput || ''}
            status={activeTestCase?.status}
            errorMessage={activeTestCase?.errorMessage}
          />
          
          {activeTestCase && (
            <div className="absolute bottom-2 right-2">
              <ValidationStatus 
                status={activeTestCase.status}
                errorMessage={activeTestCase.errorMessage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCasePanel;