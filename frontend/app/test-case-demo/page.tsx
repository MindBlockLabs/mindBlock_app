'use client';

import React, { useState } from 'react';
import TestCasePanel from '@/components/coding/TestCasePanel';

// Define the TestCase interface
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: 'pending' | 'correct' | 'wrong';
  errorMessage?: string;
}

const TestCaseDemoPage: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);

  // Mock data from the requirements
  const mockTestCases: TestCase[] = [
    {
      id: "case1",
      input: '"JavaScript is fun"',
      expectedOutput: '"fun is JavaScript"',
      actualOutput: '"fun is JavaScript"',
      status: "correct"
    },
    {
      id: "case2",
      input: '"  Hello   World  "',
      expectedOutput: '"World Hello"',
      actualOutput: "Syntax error",
      status: "wrong",
      errorMessage: "Syntax error"
    },
    {
      id: "case3",
      input: '"Code, test, deploy!"',
      expectedOutput: '"deploy! test, Code"',
      status: "pending"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test Case Panel Demo</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Challenge Solution</h2>
          
          <div className="bg-gray-850 border border-gray-700 rounded-md p-4 mb-6 min-h-[200px]">
            <div className="font-mono text-sm text-gray-300">
              <div className="mb-2">{`// Your solution here...`}</div>
              <div>{`function reverseWords(str) {`}</div>
              <div className="ml-4">{`return str.trim().split(/\\s+/).reverse().join(' ');`}</div>
              <div>{`}`}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-300 mb-3">Test Cases</h3>
            <TestCasePanel
              testCases={mockTestCases}
              activeCase={activeCase}
              onTabChange={setActiveCase}
            />
          </div>
        </div>
        
        <div className="mt-8 text-gray-400 text-sm">
          <p>Demo showing the test case panel with:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>{`Case 1: Success state (green checkmark + "Correct!")`}</li>
            <li>{`Case 2: Error state (red X + "Wrong!" + error message)`}</li>
            <li>Case 3: Pending state (no validation status)</li>
            <li>Tab navigation with keyboard support</li>
            <li>Expand/collapse functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestCaseDemoPage;