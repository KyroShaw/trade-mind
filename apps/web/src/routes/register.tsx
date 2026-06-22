import { createFileRoute, useNavigate } from "@tanstack/react-router";

import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	return (
		<div className="flex h-svh items-start justify-center">
			<SignUpForm onSwitchToSignIn={() => navigate({ to: "/login" })} />
		</div>
	);
}
