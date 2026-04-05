import { cn } from '@/shared/lib/cn';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />;
}
