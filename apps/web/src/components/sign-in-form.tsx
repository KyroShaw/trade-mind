import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@trade-mind/ui/components/alert";
import { Button } from "@trade-mind/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@trade-mind/ui/components/card";
import { Input } from "@trade-mind/ui/components/input";
import { Label } from "@trade-mind/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate();
	const { isPending } = authClient.useSession();
	const [formError, setFormError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setFormError(null);
			await authClient.signIn.email(
				{ email: value.email, password: value.password },
				{
					onSuccess: () => {
						navigate({ to: "/" });
						toast.success("登录成功");
					},
					onError: (error) => {
						setFormError(error.error.message || "邮箱或密码不正确");
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("邮箱格式不正确"),
				password: z.string().min(8, "密码至少 8 位"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<p className="text-center font-semibold text-muted-foreground text-xs uppercase tracking-widest">
					trade-mind
				</p>
				<CardTitle className="text-center text-base">登录账户</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					{formError && (
						<Alert variant="destructive">
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					)}

					<form.Field name="email">
						{(field) => (
							<div className="space-y-1">
								<Label htmlFor={field.name}>邮箱</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="you@example.com"
									type="email"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-xs" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<div className="space-y-1">
								<Label htmlFor={field.name}>密码</Label>
								<Input
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="password"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p className="text-destructive text-xs" key={error?.message}>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								className="w-full"
								disabled={!canSubmit || isSubmitting}
								type="submit"
							>
								{isSubmitting ? "登录中..." : "登录"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
			<CardFooter className="justify-center">
				<Button className="text-xs" onClick={onSwitchToSignUp} variant="link">
					没有账号？立即注册
				</Button>
			</CardFooter>
		</Card>
	);
}
