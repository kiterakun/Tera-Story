import { toast } from 'sonner';

/**
 * Centralized toast utility for Tera-Story.
 * Wraps sonner's API with app-consistent defaults.
 */

export function showSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

export function showError(message: string, description?: string) {
  toast.error(message, { description });
}

export function showInfo(message: string, description?: string) {
  toast.info(message, { description });
}

export function showWarning(message: string, description?: string) {
  toast.warning(message, { description });
}

/**
 * Shows a loading toast that can be resolved to success or error.
 * Returns an object with `success()` and `error()` to update the toast.
 */
export function showLoading(message: string) {
  const id = toast.loading(message);
  return {
    success: (msg: string, description?: string) => {
      toast.success(msg, { id, description });
    },
    error: (msg: string, description?: string) => {
      toast.error(msg, { id, description });
    },
    dismiss: () => {
      toast.dismiss(id);
    },
  };
}

export { toast };
