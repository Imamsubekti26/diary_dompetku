import { Hono } from "hono";
import {
    generateSuccessMessage,
    sendMessage,
    updateCallbackButton,
    updateMessage,
} from "../tools/telegram";
import { extractGeminiText, sendQuetion } from "../tools/gemini";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { registerNewChat } from "../tools/database";
import { and, eq } from "drizzle-orm";

type Bindings = {
    TELEGRAM_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
    DB: D1Database;
};

const webhook = new Hono<{ Bindings: Bindings }>();
webhook.post("/", async (c) => {
    // Get important variable
    const geminiApiKey = c.env.GEMINI_API_KEY;
    const token = c.env.TELEGRAM_BOT_TOKEN;
    const body = await c.req.json();

    // init DB
    const db = drizzle(c.env.DB, { schema });

    // Handle New Message
    const message: string = body?.message?.text;
    if (message) {
        /* ==== Ensure body has chat id ==== */
        const chatId = body?.message?.chat?.id;
        if (!chatId) {
            console.warn("No chat id found, request not processed");
            return c.json({ ok: true });
        }

        const userMessageId = body?.message?.message_id;
        if (userMessageId) {
            await db
                .update(schema.chatrooms)
                .set({ lastUserMessageId: userMessageId })
                .where(eq(schema.chatrooms.id, chatId));
        }

        /* ==== Handle "start" command ==== */
        if (message.toLocaleLowerCase() === "/start") {
            if (await registerNewChat(db, chatId)) {
                await sendMessage(
                    token,
                    chatId,
                    "Selamat datang! ketik sesuatu. misal: 'beli batagor 10 ribu'",
                    db,
                );
            }
            return c.json({ ok: true });
        }

        /* ==== Handle random message ==== */

        // Send loading message first
        const botMessageId = await sendMessage(
            token,
            chatId,
            "_Loading..._",
            db,
        );
        if (!botMessageId) {
            return c.json({ ok: true });
        }

        // summarize by gemini
        const res = await sendQuetion(message, chatId, {
            apiKey: geminiApiKey,
            db,
        });
        const result = extractGeminiText(res);

        // Default message
        let reply = `Maaf, ada kesalahan dalam memproses permintaanmu. pastikan keterangan dan nominal yang kamu tulis jelas.`;
        let callback = undefined;

        // Send reject message if it don't follow the rules
        if (!result[0].success) {
            // do nothing, use default message
        }

        // Message type is 'in' or 'out'
        else if (["in", "out"].includes(result[0].type || "out")) {
            reply = generateSuccessMessage(result);
            callback = [
                { text: "✅ Ya", callback_data: "confirm_transaction" },
                { text: "❌ Batal", callback_data: "reject_transaction" },
            ];
        }

        // Message type is 'summary'
        else if (result[0].type === "summary") {
            reply =
                "Maaf, fitur summary sedang dalam pengembangan, silahkan coba lagi nanti, terima kasih :(";
        }

        // Fallback reply
        else {
            // do nothing, use default message
        }

        // Update message and save the transaction
        const updatedMessage = await updateMessage(
            token,
            chatId,
            botMessageId,
            reply,
            callback,
        );
        if (updatedMessage && result.length > 0) {
            const transactions = result
                .map((tx) => ({
                    chatId: chatId,
                    messageId: botMessageId,
                    activity: tx.activity || "unknown activity",
                    categoryId: tx.category_id || 1,
                    date: new Date(tx.time || Date.now()),
                    isSuccess: tx.success,
                    nominal: tx.total || 0,
                    walletId: tx.wallet_id || 1,
                    type: tx.type === "in" ? "in" : "out",
                }))
                .filter((tx) => tx.type === "in" || tx.type === "out");

            await db.insert(schema.transactions).values(transactions);
        }

        return c.json({ ok: true });
    }

    // Handle Callback query
    const callbackQuery: string = body?.callback_query?.data;
    if (callbackQuery) {
        /* ==== Ensure body has chat id ==== */
        const chatId = body?.callback_query?.message?.chat?.id;
        const messageId = body?.callback_query?.message?.message_id;
        if (!chatId || !messageId) {
            console.log(body);
            console.warn("No chat/message id found, request not processed");
            return c.json({ ok: true });
        }

        // Handle accept callback
        if (callbackQuery === "confirm_transaction") {
            await updateCallbackButton(token, chatId, messageId);
            await sendMessage(token, chatId, "sip, transaksimu tersimpan", db);
            await db
                .update(schema.transactions)
                .set({ verifiedAt: new Date() })
                .where(
                    and(
                        eq(schema.transactions.chatId, chatId),
                        eq(schema.transactions.messageId, messageId),
                    ),
                );
        }

        // Handle reject callback
        else if (callbackQuery === "reject_transaction") {
            await updateCallbackButton(token, chatId, messageId);
            await updateMessage(
                token,
                chatId,
                messageId,
                "_Anda membatalkan transaksi :( _",
            );
            await db
                .delete(schema.transactions)
                .where(
                    and(
                        eq(schema.transactions.chatId, chatId),
                        eq(schema.transactions.messageId, messageId),
                    ),
                );
        }

        return c.json({ ok: true });
    }

    return c.json({ ok: true });
});

webhook.get("/", (c) => {
    return c.text("Telegram webhook endpoint is alive ✅");
});

export default webhook;
