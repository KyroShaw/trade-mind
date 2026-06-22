import { Link } from "@tanstack/react-router";
import {
	BarChart3,
	LineChart,
	ListOrdered,
	Search,
	Settings,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

const navItems = [
	{ to: "/", label: "行情调研", icon: Search },
	{ to: "/alpha", label: "Alpha 项目", icon: BarChart3 },
	{ to: "/orders", label: "订单复盘", icon: ListOrdered },
	{ to: "/analysis", label: "资金曲线", icon: LineChart },
] as const;

export default function Sidebar() {
	return (
		<aside className="flex w-60 shrink-0 flex-col border-r bg-card">
			<div className="flex h-14 items-center border-b px-4">
				<span className="font-semibold text-sm">trade-mind</span>
			</div>

			<nav aria-label="主导航" className="flex-1 p-2">
				{navItems.map(({ to, label, icon: Icon }) => (
					<Link
						className="flex items-center gap-3 px-3 py-2 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
						key={to}
						to={to}
					>
						<Icon aria-hidden="true" className="size-4 shrink-0" />
						{label}
					</Link>
				))}
			</nav>

			<div className="border-t p-2">
				<Link
					className="flex items-center gap-3 px-3 py-2 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
					to="/settings"
				>
					<Settings aria-hidden="true" className="size-4 shrink-0" />
					设置
				</Link>
				<div className="mt-1 flex items-center justify-between px-1">
					<UserMenu />
					<ModeToggle />
				</div>
			</div>
		</aside>
	);
}
