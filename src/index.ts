import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
    console.log(c.env.TELEGRAM_BOT_TOKEN);
    return c.text("Hello Hono!");
});

app.post("/webhook", async (c) => {
    const body = await c.req.json();
    console.log(body);

    const message = body?.message?.text;
    const chatId = body?.message?.chat?.id;

    if (message && chatId) {
        const reply = `Kamu bilang: ${message}`;
        const token = c.env.TELEGRAM_BOT_TOKEN;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: reply,
            }),
        });
    }

    return c.json({ ok: true });
});

export default app;
