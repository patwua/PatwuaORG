import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: React.ComponentProps<'img'>) {
  return (
    <img
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
        className,
      )}
      {...props}
    />
  );
}

