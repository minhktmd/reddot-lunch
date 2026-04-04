import { Input } from '@/shared/components/atoms/input';
import { Label } from '@/shared/components/atoms/label';

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={!!error} {...inputProps} />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
