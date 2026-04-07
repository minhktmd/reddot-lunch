import { cn } from '@/shared/lib/cn';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-foreground text-sm font-medium', className)} {...props} />;
}
