import React from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className }) => {
  return (
    <div className={`relative overflow-auto ${className || ''}`}>
      {children}
    </div>
  );
};

export { ScrollArea };
