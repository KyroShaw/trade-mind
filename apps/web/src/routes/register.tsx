import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/register")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session?.data?.session) {
			throw redirect({ to: "/" });
		}
	},
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	return (
		<div className="flex h-svh items-center justify-center">
			<SignUpForm onSwitchToSignIn={() => navigate({ to: "/login" })} />
		</div>
	);
}
