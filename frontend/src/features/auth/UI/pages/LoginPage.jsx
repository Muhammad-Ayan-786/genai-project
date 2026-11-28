import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthForm } from '../../Hooks/useAuthForm.js';
import { useAuth } from '../../Hooks/useAuth.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { FormField } from '../components/FormField.jsx';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';
import { BRAND } from '../../../../shared/brand.js';

export function LoginPage() {
  const form = useAuthForm('login');
  const { sessionError } = useAuth();
  return (
    <AuthLayout variant="login">
      <p className="label">Log in</p>
      <h1 className="mt-4 font-serif text-[44px] leading-[1.05] font-light tracking-[-0.03em]">Welcome back.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">Log in to pick up any conversation where you left it.</p>

      <form noValidate onSubmit={form.submit} className="mt-10 space-y-5" aria-busy={form.pending}>
        <ErrorMessage>{form.error || sessionError}</ErrorMessage>
        <fieldset disabled={form.pending} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Log in</legend>
          <FormField
            label="Email address" {...form.field('email')} type="email" autoComplete="email" autoCapitalize="none"
            spellCheck={false} placeholder="you@example.com" required error={form.fieldErrors.email}
          />
          <FormField
            label="Password" {...form.field('password')} type={form.showPassword ? 'text' : 'password'}
            autoComplete="current-password" placeholder="Your password" required
            error={form.fieldErrors.password}
            showPassword={form.showPassword} onToggle={form.togglePassword}
          />
          <button type="submit" className="btn-primary group mt-3 min-h-13 w-full" disabled={form.pending}>
            {form.pending
              ? <><Spinner /> Logging in...</>
              : <>Log in <ArrowRight className="size-4" aria-hidden="true" /></>}
          </button>
        </fieldset>
      </form>

      <p className="mt-8 text-center text-[14px] text-muted">
        New to {BRAND.name}?{' '}
        <Link to="/register" className="text-link inline-flex min-h-11 items-center">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
