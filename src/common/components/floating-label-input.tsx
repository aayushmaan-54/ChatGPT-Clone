import React from 'react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';
import { FloatingLabelInputProps } from '../types/props.types';



export default function FloatingLabelInput({ label, ...props }: FloatingLabelInputProps) {
  const inputId = props.id || `floating-input-${label.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="relative">
      <Input
        {...props}
        id={inputId}
        placeholder=" "
        className={cn(
          "peer placeholder-transparent focus:border-auth-link! focus:ring-0! h-12 rounded-full pl-4",
          props.className
        )}
      />
      <Label
        htmlFor={inputId}
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-all duration-75 ease-in-out pointer-events-none px-1",
          "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base",
          "peer-focus:top-0 peer-focus:text-xs peer-focus:bg-background peer-focus:text-auth-link",
          "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:bg-background"
        )}
      >
        {label}
      </Label>
    </div>
  );
}
