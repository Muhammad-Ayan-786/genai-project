import { Eye, EyeOff } from 'lucide-react';

export function FormField({ label, name, error, hint, showPassword, onToggle, ...inputProps }) {
  const description = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div>
      <label htmlFor={name} className="label mb-2.5 block text-muted">{label}</label>
      <div className="relative">
        <input
          {...inputProps}
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          className={`form-input ${onToggle ? 'pr-14' : ''} ${error ? 'border-error focus:border-error' : ''}`}
        />
        {onToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-1.5 my-auto flex size-10 items-center justify-center rounded-full text-faint transition-colors hover:bg-raised hover:text-ink"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={onToggle}
          >
            {showPassword ? <EyeOff size={17} strokeWidth={1.7} /> : <Eye size={17} strokeWidth={1.7} />}
          </button>
        )}
      </div>
      {error
        ? <p id={`${name}-error`} className="mt-2 text-[13px] leading-5 text-error">{error}</p>
        : hint && <p id={`${name}-hint`} className="mt-2 text-[13px] leading-5 text-faint">{hint}</p>}
    </div>
  );
}
