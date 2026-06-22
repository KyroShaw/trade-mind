import { cn } from "@trade-mind/ui/lib/utils";
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	useContext,
	useState,
} from "react";

const TooltipContext = createContext<{ open: boolean }>({ open: false });

function TooltipProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

function Tooltip({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<TooltipContext.Provider value={{ open }}>
			<div
				className="relative inline-flex"
				onBlur={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
			>
				{children}
			</div>
		</TooltipContext.Provider>
	);
}

function TooltipTrigger({
	children,
	asChild: _asChild,
	...props
}: ComponentProps<"span"> & { asChild?: boolean }) {
	return (
		<span data-slot="tooltip-trigger" {...props}>
			{children}
		</span>
	);
}

function TooltipContent({
	className,
	children,
	...props
}: ComponentProps<"div">) {
	const { open } = useContext(TooltipContext);
	if (!open) {
		return null;
	}
	return (
		<div
			className={cn(
				"absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-none bg-popover px-2 py-1.5 text-[11px] text-popover-foreground shadow-md ring-1 ring-foreground/10",
				className
			)}
			data-slot="tooltip-content"
			role="tooltip"
			{...props}
		>
			{children}
		</div>
	);
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
