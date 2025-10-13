import { Hono } from "hono";
import { extractGeminiText, sendQuetion } from "./repository/gemini";

type Bindings = {
    TELEGRAM_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
    return c.text("Apa lo liat-liat!");
});

app.post("/webhook", async (c) => {
    const geminiApiKey = c.env.GEMINI_API_KEY;
    const token = c.env.TELEGRAM_BOT_TOKEN;
    const body = await c.req.json();

    const message = body?.message?.text;
    const chatId = body?.message?.chat?.id;

    if (message && chatId) {
        const res = await sendQuetion(message, {
            apiKey: geminiApiKey,
        });

        const result = extractGeminiText(res);

        let reply = `Maaf, ada kesalahan dalam memproses permintaanmu. pastikan keterangan dan nominal yang kamu tulis jelas.`;
        if (result.success) {
            reply =
                `*📋 Berikut rincian transaksimu:*\n\n` +
                `*Jenis Transaksi:* ${result.is_out ? "🔴 Pengeluaran" : "🟢 Pendapatan"}\n` +
                `*Nominal:* ${result.total?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}\n` +
                `*Keterangan:* ${result.activity || "-"}\n` +
                `*Kategori:* ${result.category || "-"}\n` +
                `*Tanggal:* ${new Date(result.time || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`;
        }

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: reply,
                parse_mode: "Markdown",
            }),
        });
    }

    return c.json({ ok: true });
});

export default app;
