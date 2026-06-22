import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@trade-mind/ui/lib/utils";

const alertVariants = cva(
  "relative flex w-full items-center gap-3 rounded-none border px-4 py-3 text-xs",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
        warning:
          "border-amber-400/50 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="alert-title" className={cn("font-medium leading-none", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs/relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
