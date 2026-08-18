import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-eco-200 bg-white px-3 text-sm text-eco-900 placeholder:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
