import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session?.data?.session) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	return (
		<div className="flex h-svh items-center justify-center">
			<SignInForm onSwitchToSignUp={() => navigate({ to: "/register" })} />
		</div>
	);
}
