import { Toaster } from 'sonner';
import { useTheme } from './theme-provider';

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      closeButton
      richColors={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'group !rounded-xl !border !border-border !bg-card !text-foreground !shadow-pop !font-sans',
          title: '!text-sm !font-semibold',
          description: '!text-xs !text-muted-foreground',
          actionButton: '!rounded-lg !bg-primary !text-primary-foreground',
          cancelButton: '!rounded-lg !bg-muted !text-muted-foreground',
          closeButton: '!rounded-md !border-border !bg-card !text-muted-foreground',
          success: '[&_[data-icon]]:!text-success',
          error: '[&_[data-icon]]:!text-danger',
          warning: '[&_[data-icon]]:!text-warning',
          info: '[&_[data-icon]]:!text-info',
        },
      }}
    />
  );
}
