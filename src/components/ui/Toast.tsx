import toast from 'react-hot-toast';

interface ToastOptions {
  title: string;
  description?: string;
  status?: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
}

export const showToast = (options: ToastOptions) => {
  const { title, description, status = 'info', duration = 5000 } = options;
  const message = description ? `${title}\n${description}` : title;

  switch (status) {
    case 'success':
      toast.success(message, { duration });
      break;
    case 'error':
      toast.error(message, { duration });
      break;
    default:
      toast(message, { duration });
  }
};

export { toast };
