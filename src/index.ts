import { Hono } from "hono";
import { extractGeminiText, sendQuetion } from "./tools/gemini";
import webhook from "./routes/webhook";

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

app.route("/webhook", webhook);

export default app;
