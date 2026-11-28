import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthForm } from '../../Hooks/useAuthForm.js';
import { useAuth } from '../../Hooks/useAuth.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { FormField } from '../components/FormField.jsx';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';

export function RegisterPage() {
  const form = useAuthForm('register');
  const { sessionError } = useAuth();
  return (
    <AuthLayout variant="register">
      <p className="label">Create account</p>
      <h1 className="mt-4 font-serif text-[44px] leading-[1.05] font-light tracking-[-0.03em]">Let&apos;s get you started.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">A name, an email and a password. That&apos;s all.</p>

      <form noValidate onSubmit={form.submit} className="mt-10 space-y-5" aria-busy={form.pending}>
        <ErrorMessage>{form.error || sessionError}</ErrorMessage>
        <fieldset disabled={form.pending} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Create an account</legend>
          <FormField
            label="Your name" {...form.field('name')} type="text" autoComplete="name" placeholder="Alex Morgan"
            maxLength={50} required error={form.fieldErrors.name}
          />
          <FormField
            label="Email address" {...form.field('email')} type="email" autoComplete="email" autoCapitalize="none"
            spellCheck={false} placeholder="you@example.com" required error={form.fieldErrors.email}
          />
          <FormField
            label="Password" {...form.field('password')} type={form.showPassword ? 'text' : 'password'}
            autoComplete="new-password" placeholder="Create a strong password" required
            error={form.fieldErrors.password}
            hint="At least 8 characters, with a letter and a number."
            showPassword={form.showPassword} onToggle={form.togglePassword}
          />
          <button type="submit" className="btn-primary group mt-3 min-h-13 w-full" disabled={form.pending}>
            {form.pending
              ? <><Spinner /> Creating your account...</>
              : <>Create account <ArrowRight className="size-4" aria-hidden="true" /></>}
          </button>
        </fieldset>
      </form>

      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-link inline-flex min-h-11 items-center">Log in</Link>
      </p>
    </AuthLayout>
  );
}
