import * as React from "react";

import { cn } from "@trade-mind/ui/lib/utils";

const TooltipContext = React.createContext<{ open: boolean }>({ open: false });

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open }}>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
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
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  return (
    <span data-slot="tooltip-trigger" {...props}>
      {children}
    </span>
  );
}

function TooltipContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open } = React.useContext(TooltipContext);
  if (!open) return null;
  return (
    <div
      data-slot="tooltip-content"
      role="tooltip"
      className={cn(
        "absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-none bg-popover px-2 py-1.5 text-[11px] text-popover-foreground shadow-md ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
