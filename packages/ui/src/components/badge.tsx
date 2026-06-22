import { cn } from "@trade-mind/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
	"inline-flex items-center rounded-none px-2 py-0.5 font-medium text-[10px] ring-1 ring-inset",
	{
		variants: {
			variant: {
				default: "bg-primary/10 text-primary ring-primary/20",
				secondary: "bg-secondary text-secondary-foreground ring-secondary/20",
				destructive: "bg-destructive/10 text-destructive ring-destructive/20",
				warning:
					"bg-amber-50 text-amber-700 ring-amber-300/50 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-400/30",
				outline: "bg-transparent text-foreground ring-border",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

function Badge({
	className,
	variant,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return (
		<span
			className={cn(badgeVariants({ variant }), className)}
			data-slot="badge"
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
