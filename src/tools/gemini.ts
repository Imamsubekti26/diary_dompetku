import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

type geminiConfig = {
    apiKey: string;
    db?: DrizzleD1Database<typeof schema>;
};

type geminiResponse = {
    success: boolean;
    time?: string;
    total?: number;
    category?: string;
    category_id?: number;
    wallet?: string;
    wallet_id?: number;
    activity?: string;
    type?: string;
};

export const sendQuetion = async (
    content: string,
    chatId: number,
    config: geminiConfig,
) => {
    const geminiEndpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
    const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: await systemInstruction(chatId, config.db) }],
            },
            contents: [
                {
                    parts: [{ text: content }],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
            },
        }),
    });
    return response.json();
};

const systemInstruction = async (
    chatId: number,
    db?: DrizzleD1Database<typeof schema>,
) => {
    const categories = await db
        ?.select({
            id: schema.categories.id,
            categoryName: schema.categories.categoryName,
        })
        .from(schema.categories)
        .where(eq(schema.categories.chatId, chatId));

    const wallets = await db
        ?.select({
            id: schema.wallets.id,
            walletName: schema.wallets.walletName,
            isDefault: schema.wallets.isDefault,
        })
        .from(schema.wallets)
        .where(eq(schema.wallets.chatId, chatId));

    const text = `
        Konteks: transaksi keuangan.
        hari ini: ${new Date().toDateString()}.
        Category Data: ${JSON.stringify(categories)}.
        Wallet Data: ${JSON.stringify(wallets)}.
        Aturan:
        - tanpa penjelasan;
        - bisa lebih dari satu hasil;
        - waktu default: hari ini jika tidak disebut;
        - sesuaikan category dan wallet sesuai data yang diberikan;
        - tipe pesan: in/out/summary;
        - in/out: pada text, wajib ada activity & total; jika tidak ada, hasil [{success:false,type:out}];
        - tipe summary: gunakan rentang tanggal, default minggu ini;
        Format:
        - in/out → [{success:true,time:'YYYY-mm-dd',total:number,category:'string',category_id:number,wallet:'string',wallet_id:number,activity:'string',type:in/out}]
        - summary → [{success:true,type:summary,from:'YYYY-mm-dd',to:'YYYY-mm-dd'}]
        `;
    return text;
};

export const extractGeminiText = (responseData: any): geminiResponse[] => {
    if (!responseData || !responseData.candidates?.length) {
        return [{ success: false }];
    }

    const texts = responseData.candidates
        .map((candidate: any) => {
            const parts = candidate.content?.parts || [];
            return parts
                .map((part: any) => part.text)
                .filter((text: string | undefined) => !!text)
                .join(" ");
        })
        .filter((t: string) => t.trim().length > 0);

    const jsonResult = JSON.parse(texts[0]);

    return jsonResult;
};
