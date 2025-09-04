import toast from 'react-hot-toast';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = description ? `${title}\n${description}` : title;
    
    if (variant === 'destructive') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };
  
  return {
    toast: showToast
  };
};
