import { createFileRoute, useNavigate } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	return (
		<div className="flex h-svh items-start justify-center">
			<SignInForm onSwitchToSignUp={() => navigate({ to: "/register" })} />
		</div>
	);
}
