import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function Avatar({
  displayName,
  avatarUrl,
  size = "md",
  className,
}: {
  displayName: string;
  avatarUrl: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-eco-200 font-semibold text-eco-800",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
