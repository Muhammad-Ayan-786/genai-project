import { createElement } from 'react';
import toast from 'react-hot-toast';
import { ToastCard } from './ToastCard.jsx';

const durations = { success: 3200, error: 5000, info: 3600 };

function show(variant, title, message, options = {}) {
  return toast.custom(
    (t) => createElement(ToastCard, { t, variant, title, message }),
    { duration: durations[variant], ...options },
  );
}

/**
 * The app's only way to show a toast. Call it from Hooks (not UI components),
 * the same layer that talks to the API and Redux.
 *
 *   notify.success('Saved', 'Your changes are safe.');
 *   notify.error('Could not send', 'Check your connection.', { id: 'send' });
 *
 * Pass `{ id }` to replace an existing toast instead of stacking a new one.
 * Returns the toast id, so you can dismiss it with notify.dismiss(id).
 */
export const notify = {
  success: (title, message, options) => show('success', title, message, options),
  error: (title, message, options) => show('error', title, message, options),
  info: (title, message, options) => show('info', title, message, options),
  dismiss: (id) => toast.dismiss(id),
};
