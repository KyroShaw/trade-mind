import { cn } from "@trade-mind/ui/lib/utils";
import {
	type ComponentProps,
	createContext,
	useContext,
	useState,
} from "react";

const TabsContext = createContext<{
	value: string;
	onValueChange: (value: string) => void;
}>({ value: "", onValueChange: (_v: string) => undefined });

interface TabsProps extends ComponentProps<"div"> {
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	value?: string;
}

function Tabs({
	className,
	defaultValue,
	value: controlledValue,
	onValueChange,
	...props
}: TabsProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
	const value = controlledValue ?? uncontrolled;
	const handleChange = onValueChange ?? setUncontrolled;

	return (
		<TabsContext.Provider value={{ value, onValueChange: handleChange }}>
			<div
				className={cn("flex flex-col gap-2", className)}
				data-slot="tabs"
				{...props}
			/>
		</TabsContext.Provider>
	);
}

function TabsList({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn("flex h-8 items-center gap-1 border-b", className)}
			data-slot="tabs-list"
			role="tablist"
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	value,
	children,
	...props
}: ComponentProps<"button"> & { value: string }) {
	const ctx = useContext(TabsContext);
	const isSelected = ctx.value === value;

	return (
		<button
			aria-selected={isSelected}
			className={cn(
				"relative h-full px-3 font-medium text-muted-foreground text-xs outline-none transition-colors after:absolute after:inset-x-0 after:bottom-[-1px] after:hidden after:h-px after:bg-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-foreground data-[selected]:after:block",
				className
			)}
			data-selected={isSelected || undefined}
			data-slot="tabs-trigger"
			onClick={() => ctx.onValueChange(value)}
			role="tab"
			type="button"
			{...props}
		>
			{children}
		</button>
	);
}

function TabsContent({
	className,
	value,
	...props
}: ComponentProps<"div"> & { value: string }) {
	const ctx = useContext(TabsContext);
	if (ctx.value !== value) {
		return null;
	}

	return (
		<div
			className={cn("outline-none", className)}
			data-slot="tabs-content"
			role="tabpanel"
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
