import { Hono } from "hono";
import { extractGeminiText, sendQuetion } from "./tools/gemini";
import {
    generateSuccessMessage,
    sendMessage,
    updateMessage,
} from "./tools/telegram";

type Bindings = {
    TELEGRAM_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
    return c.text("Apa lo liat-liat!");
});

app.post("/ask", async (c) => {
    const geminiApiKey = c.env.GEMINI_API_KEY;
    const body = await c.req.json();

    const result = await sendQuetion(body?.question || "hi", {
        apiKey: geminiApiKey,
    });
    return c.json({ data: extractGeminiText(result) });
});

app.post("/webhook", async (c) => {
    const geminiApiKey = c.env.GEMINI_API_KEY;
    const token = c.env.TELEGRAM_BOT_TOKEN;
    const body = await c.req.json();

    const chatId = body?.message?.chat?.id;
    if (!chatId) {
        return c.json({ ok: true });
    }

    // Handle New Message
    const message: string = body?.message?.text;
    if (message) {
        // Filter message "ya"
        if (['ya', 'y', 'yes', 'ok', 'sip'].includes(message.toLowerCase())) {
            await sendMessage(token, chatId, "sip, transaksimu tercatat!");
            return c.json({ ok: true });
        }

        // Send loading message first
        const messageId = await sendMessage(token, chatId, "_Loading..._");
        if (!messageId) {
            return c.json({ ok: true });
        }

        // summarize by gemini
        const res = await sendQuetion(message, { apiKey: geminiApiKey });
        const result = extractGeminiText(res);

        let reply = `Maaf, ada kesalahan dalam memproses permintaanmu. pastikan keterangan dan nominal yang kamu tulis jelas.`;
        if (result[0].success) {
            reply = generateSuccessMessage(result);
        }

        await updateMessage(token, chatId, messageId, reply);
    }

    return c.json({ ok: true });
});

export default app;
