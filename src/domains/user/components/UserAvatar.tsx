import { cn } from '@/shared/lib/cn';

import type { User } from '../types/user.type';

type Props = {
  user: Pick<User, 'name' | 'avatarUrl'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASSES = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-base',
} as const;

export function UserAvatar({ user, size = 'md', className }: Props) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatarUrl} alt={user.name} className={cn('rounded-full object-cover', sizeClass, className)} />
    );
  }

  return (
    <span
      aria-label={user.name}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600',
        sizeClass,
        className
      )}
    >
      {initials}
    </span>
  );
}
