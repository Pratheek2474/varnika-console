import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-[#F0EBE3] rounded-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
