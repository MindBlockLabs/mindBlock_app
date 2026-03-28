import React from 'react';

interface OutputDisplayProps {
  output: string;
  status?: 'pending' | 'correct' | 'wrong';
  errorMessage?: string;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ 
  output, 
  status,
  errorMessage 
}) => {
  const isError = status === 'wrong';
  const isPending = status === 'pending';
  
  let displayText = output;
  let textColor = 'text-gray-300';
  
  if (isError && errorMessage) {
    displayText = errorMessage;
    textColor = 'text-red-400';
  } else if (isPending) {
    displayText = 'Waiting for your solution...';
    textColor = 'text-gray-500';
  }
  
  return (
    <div className="bg-gray-850 border border-gray-700 rounded-md p-4 min-h-[120px] max-h-40 overflow-y-auto">
      <pre className={`font-mono text-sm ${textColor} whitespace-pre-wrap break-words`}>
        {displayText}
      </pre>
    </div>
  );
};

export default OutputDisplay;