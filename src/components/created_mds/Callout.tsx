'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutStyles = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    IconComponent: Info,
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    IconComponent: AlertTriangle,
  },
  tip: {
    container: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    IconComponent: Lightbulb,
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    IconComponent: AlertCircle,
  },
};

/**
 * Callout Component
 * Styled callout boxes for info, warnings, tips, and errors
 */
export const Callout: React.FC<CalloutProps> = ({
  type = 'info',
  title,
  children,
  className,
}) => {
  const styles = calloutStyles[type];
  const IconComponent = styles.IconComponent;

  return (
    <div
      className={cn(
        'my-4 rounded-lg border p-4',
        styles.container,
        className
      )}
    >
      <div className="flex gap-3">
        <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('font-semibold mb-1', styles.title)}>{title}</p>
          )}
          <div className="text-sm text-foreground/80">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Callout;
