import { cn } from "@trade-mind/ui/lib/utils";
import type * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(
				"flex min-h-20 w-full rounded-none border border-input bg-background px-3 py-2 text-foreground text-xs/relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
				className
			)}
			data-slot="textarea"
			{...props}
		/>
	);
}

export { Textarea };
