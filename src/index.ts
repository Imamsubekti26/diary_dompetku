import { Hono } from "hono";
import webhook from "./routes/webhook";

type Bindings = {
    TELEGRAM_BOT_TOKEN: string;
    GEMINI_API_KEY: string;
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
    return c.text("Apa lo liat-liat!");
});

app.route("/webhook", webhook);

export default app;
