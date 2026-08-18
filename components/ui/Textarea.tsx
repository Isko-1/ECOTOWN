import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-eco-200 bg-white px-3 py-2 text-sm text-eco-900 placeholder:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
