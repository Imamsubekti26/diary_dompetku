import { Hono } from "hono";
import {
    generateSuccessMessage,
    sendMessage,
    updateMessage,
} from "../tools/telegram";
import { extractGeminiText, sendQuetion } from "../tools/gemini";

type Bindings = {
    TELEGRAM_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
};

const webhook = new Hono<{ Bindings: Bindings }>();
webhook.post("/", async (c) => {
    // Get important variable
    const geminiApiKey = c.env.GEMINI_API_KEY;
    const token = c.env.TELEGRAM_BOT_TOKEN;
    const body = await c.req.json();

    // Ensure body has chat id
    const chatId = body?.message?.chat?.id;
    if (!chatId) {
        console.warn("No chat id found, request not processed");
        return c.json({ ok: true });
    }

    // Handle New Message
    const message: string = body?.message?.text;
    if (message) {
        /* ==== Handle "start" command ==== */
        if (message.toLocaleLowerCase() === "/start") {
            await sendMessage(
                token,
                chatId,
                "ketik sesuatu. misal: 'beli batagor 10 ribu'",
            );
            return c.json({ ok: true });
        }

        /* ==== Handle confirmation message ==== */
        if (["ya", "y", "yes", "ok", "sip"].includes(message.toLowerCase())) {
            await sendMessage(token, chatId, "sip, transaksimu tercatat!");
            return c.json({ ok: true });
        }

        /* ==== Handle random message ==== */

        // Send loading message first
        const messageId = await sendMessage(token, chatId, "_Loading..._");
        if (!messageId) {
            return c.json({ ok: true });
        }

        // summarize by gemini
        const res = await sendQuetion(message, { apiKey: geminiApiKey });
        const result = extractGeminiText(res);

        // Default message
        let reply = `Maaf, ada kesalahan dalam memproses permintaanmu. pastikan keterangan dan nominal yang kamu tulis jelas.`;

        // Send reject message if it don't follow the rules
        if (!result[0].success) {
            // do nothing, use default message
        }

        // Message type is 'in' or 'out'
        else if (["in", "out"].includes(result[0].type || "out")) {
            reply = generateSuccessMessage(result);
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

        await updateMessage(token, chatId, messageId, reply);
        return c.json({ ok: true });
    }
});

export default webhook;
