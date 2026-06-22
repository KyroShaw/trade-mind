import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@trade-mind/ui/components/alert";
import { Button } from "@trade-mind/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@trade-mind/ui/components/card";
import { Input } from "@trade-mind/ui/components/input";
import { Label } from "@trade-mind/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/_protected/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const queryClient = useQueryClient();
	const [bindError, setBindError] = useState<string | null>(null);

	const { data: status, isLoading } = useQuery(
		trpc.apiKey.getStatus.queryOptions()
	);

	const bindMutation = useMutation(
		trpc.apiKey.bind.mutationOptions({
			onSuccess: (data) => {
				toast.success(`API 绑定成功，UID：${data.uid}`);
				queryClient.invalidateQueries(trpc.apiKey.getStatus.queryFilter());
				setBindError(null);
				form.reset();
			},
			onError: (error) => {
				setBindError(error.message);
			},
		})
	);

	const unbindMutation = useMutation(
		trpc.apiKey.unbind.mutationOptions({
			onSuccess: () => {
				toast.success("已解除 API 绑定");
				queryClient.invalidateQueries(trpc.apiKey.getStatus.queryFilter());
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const form = useForm({
		defaultValues: { apiKey: "", secretKey: "" },
		onSubmit: ({ value }) => {
			setBindError(null);
			bindMutation.mutate({ apiKey: value.apiKey, secretKey: value.secretKey });
		},
		validators: {
			onSubmit: z.object({
				apiKey: z.string().min(1, "请输入 API Key"),
				secretKey: z.string().min(1, "请输入 Secret Key"),
			}),
		},
	});

	return (
		<div className="max-w-lg p-6">
			<h1 className="font-semibold text-lg">设置</h1>
			<p className="mt-1 mb-6 text-muted-foreground text-xs">
				账户与 Binance API 绑定
			</p>

			<Card>
				<CardHeader>
					<CardTitle>Binance API 绑定</CardTitle>
					<CardDescription>
						绑定只读 API Key 以解锁行情分析、订单复盘等功能
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading && (
						<div className="h-8 w-32 animate-pulse rounded bg-muted" />
					)}
					{!isLoading && status?.bound && (
						<div className="rounded border border-dashed p-4 text-muted-foreground text-xs">
							<span className="font-medium text-foreground">✅ 已绑定账户</span>
							{"uid" in status && status.uid && (
								<span className="ml-2">
									UID：{status.uid.slice(0, 4)}****{status.uid.slice(-2)}
								</span>
							)}
						</div>
					)}
					{!(isLoading || status?.bound) && (
						<form
							className="space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							{bindError && (
								<Alert variant="destructive">
									<AlertDescription>{bindError}</AlertDescription>
								</Alert>
							)}

							<form.Field name="apiKey">
								{(field) => (
									<div className="space-y-1">
										<Label htmlFor={field.name}>API Key</Label>
										<Input
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="填写 Binance API Key"
											value={field.state.value}
										/>
										{field.state.meta.errors.map((error) => (
											<p
												className="text-destructive text-xs"
												key={error?.message}
											>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<form.Field name="secretKey">
								{(field) => (
									<div className="space-y-1">
										<Label htmlFor={field.name}>Secret Key</Label>
										<Input
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="填写 Binance Secret Key"
											type="password"
											value={field.state.value}
										/>
										{field.state.meta.errors.map((error) => (
											<p
												className="text-destructive text-xs"
												key={error?.message}
											>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<p className="text-muted-foreground text-xs">
								⚠️ 请确保只授予只读权限（canTrade=false）
								<a
									className="ml-1 underline"
									href="https://www.binance.com/en/support/faq/how-to-create-api-360002502072"
									rel="noopener noreferrer"
									target="_blank"
								>
									如何创建只读 API？
								</a>
							</p>
						</form>
					)}
				</CardContent>

				<CardFooter className="gap-2">
					{status?.bound ? (
						<Button
							disabled={unbindMutation.isPending}
							onClick={() => unbindMutation.mutate()}
							variant="destructive"
						>
							{unbindMutation.isPending ? "解绑中..." : "解除绑定"}
						</Button>
					) : (
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button
									disabled={
										!canSubmit || isSubmitting || bindMutation.isPending
									}
									onClick={() => form.handleSubmit()}
									type="button"
								>
									{bindMutation.isPending ? "验证中..." : "保存并验证"}
								</Button>
							)}
						</form.Subscribe>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
