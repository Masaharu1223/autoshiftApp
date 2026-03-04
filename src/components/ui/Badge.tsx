import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "yellow" | "red" | "gray";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-blue-100 text-blue-800": variant === "blue",
          "bg-green-100 text-green-800": variant === "green",
          "bg-yellow-100 text-yellow-800": variant === "yellow",
          "bg-red-100 text-red-800": variant === "red",
          "bg-gray-100 text-gray-800": variant === "gray",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
