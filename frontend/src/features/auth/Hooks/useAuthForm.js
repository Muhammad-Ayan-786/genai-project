import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { authApi } from './session.js';
import { getApiError } from '../API/auth.api.js';
import { sessionReceived } from '../State/auth.slice.js';
import { BRAND } from '../../../shared/brand.js';
import { notify } from '../../../shared/toast/notify.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validation rules, mirroring the backend's express-validator rules. */
const rules = {
  name: {
    validate: (value) => {
      const length = value.trim().length;
      return (length >= 2 && length <= 50) || 'Name must be 2-50 characters';
    },
  },
  email: {
    validate: (value) => emailPattern.test(value.trim()) || 'Enter a valid email address',
  },
  loginPassword: {
    required: 'Enter your password',
  },
  registerPassword: {
    validate: (value) => {
      // bcrypt silently ignores bytes after 72, so the backend rejects longer passwords.
      if (new TextEncoder().encode(value).length > 72) return 'Password must be at most 72 UTF-8 bytes';
      if (value.length < 8 || !/[a-z]/i.test(value) || !/\d/.test(value)) {
        return 'Use at least 8 characters, including a letter and a number';
      }
      return true;
    },
  },
};

/**
 * Login and registration form state, powered by react-hook-form.
 * @param {'login' | 'register'} mode
 */
export function useAuthForm(mode) {
  const dispatch = useDispatch();
  const isRegister = mode === 'register';
  const [showPassword, setShowPassword] = useState(false);

  const {
    register, handleSubmit, setError, clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isRegister ? { name: '', email: '', password: '' } : { email: '', password: '' },
  });

  /** Props for a <FormField>: name, ref, onChange, onBlur. */
  const field = (name) => {
    const fieldRules = name === 'password'
      ? rules[isRegister ? 'registerPassword' : 'loginPassword']
      : rules[name];
    // Typing again hides the server's banner message, like before.
    return register(name, { ...fieldRules, onChange: () => clearErrors('root.server') });
  };

  const submit = handleSubmit(async (values) => {
    const input = { email: values.email.trim(), password: values.password };
    if (isRegister) input.name = values.name.trim();
    try {
      const session = await authApi[mode](input);
      const firstName = session.user.name.split(' ')[0];
      if (isRegister) {
        notify.success(`Welcome to ${BRAND.name}, ${firstName}`, null, { id: 'auth' });
      } else {
        notify.success(`Welcome back, ${firstName}`, null, { id: 'auth' });
      }
      dispatch(sessionReceived(session));
    } catch (error) {
      const failure = getApiError(error);
      setError('root.server', { message: failure.message });
      failure.fields.forEach(({ field: name, message }) => setError(name, { type: 'server', message }));
    }
  });

  const fieldErrors = Object.fromEntries(
    ['name', 'email', 'password'].map((name) => [name, errors[name]?.message]),
  );
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const error = errors.root?.server?.message
    || (hasFieldErrors ? 'Please check the highlighted fields.' : null);

  return {
    field, submit, pending: isSubmitting, error, fieldErrors, showPassword,
    togglePassword: () => setShowPassword((value) => !value),
  };
}
