import React, { useState } from 'react';

// Context for managing dropdown state
const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild, 
  children 
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(!open);
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }
  
  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  align = 'center',
  children,
  className
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);
  
  if (!open) return null;
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  };
  
  return (
    <div className={`absolute top-full mt-1 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 z-50 ${alignClasses[align]} ${className || ''}`}>
      {children}
    </div>
  );
};

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const { setOpen } = React.useContext(DropdownMenuContext);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
    setOpen(false);
  };
  
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-700 dark:focus:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
