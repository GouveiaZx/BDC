import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 w-48 px-2 py-1 text-xs text-white bg-gray-900 rounded-md shadow-sm 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                    bottom-full left-1/2 transform -translate-x-1/2 mb-1 invisible group-hover:visible">
        {content}
        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 top-full -mt-1"></div>
      </div>
    </div>
  );
};
