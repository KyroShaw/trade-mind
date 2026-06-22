import { db } from "@trade-mind/db";
import { apiKeys } from "@trade-mind/db/schema/auth";
import { env } from "@trade-mind/env/server";
import { TRPCError } from "@trpc/server";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

function getEncryptionKey(): Buffer {
	return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

function encrypt(text: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(data: string): string {
	const key = getEncryptionKey();
	const parts = data.split(":");
	if (parts.length !== 3) throw new Error("Invalid encrypted data format");
	const [ivHex, authTagHex, encryptedHex] = parts;
	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encrypted = Buffer.from(encryptedHex, "hex");
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

async function verifyBinanceKey(apiKey: string, secretKey: string): Promise<string> {
	const timestamp = Date.now();
	const queryString = `timestamp=${timestamp}`;
	const signature = createHmac("sha256", secretKey).update(queryString).digest("hex");
	const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

	let response: Response;
	try {
		response = await fetch(url, {
			headers: { "X-MBX-APIKEY": apiKey },
		});
	} catch {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "无法连接 Binance API，请检查网络",
		});
	}

	const data = (await response.json()) as {
		code?: number;
		msg?: string;
		canTrade?: boolean;
		uid?: number;
	};

	if (!response.ok || data.code !== undefined) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: data.msg ?? "API Key 无效，请检查 Key 是否正确",
		});
	}

	if (data.canTrade !== false) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "API Key 必须设置为只读权限（canTrade=false）",
		});
	}

	return String(data.uid ?? "");
}

export const apiKeyRouter = router({
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		const [record] = await db
			.select({ binanceUid: apiKeys.binanceUid, isValid: apiKeys.isValid })
			.from(apiKeys)
			.where(eq(apiKeys.userId, ctx.session.user.id))
			.limit(1);

		if (!record?.isValid) return { bound: false };
		return { bound: true, uid: record.binanceUid ?? undefined };
	}),

	bind: protectedProcedure
		.input(z.object({ apiKey: z.string().min(1), secretKey: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const uid = await verifyBinanceKey(input.apiKey, input.secretKey);

			const encryptedKey = encrypt(input.apiKey);
			const encryptedSecret = encrypt(input.secretKey);

			await db
				.insert(apiKeys)
				.values({
					userId: ctx.session.user.id,
					encryptedKey,
					encryptedSecret,
					binanceUid: uid,
					isValid: true,
				})
				.onConflictDoUpdate({
					target: apiKeys.userId,
					set: { encryptedKey, encryptedSecret, binanceUid: uid, isValid: true },
				});

			return { uid };
		}),

	unbind: protectedProcedure.mutation(async ({ ctx }) => {
		await db.delete(apiKeys).where(eq(apiKeys.userId, ctx.session.user.id));
	}),
});

