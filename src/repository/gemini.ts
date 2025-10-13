type geminiConfig = {
    apiKey: string;
};

type geminiResponse = {
    success: boolean;
    time?: string;
    total?: number;
    category?: string;
    activity?: string;
    is_out?: boolean;
};

export const sendQuetion = async (content: string, config: geminiConfig) => {
    const geminiEndpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
    const response = await fetch(geminiEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: generatePromt(content) }],
                },
            ],
        }),
    });
    return response.json();
};

const generatePromt = (content: string) => {
    const text = `
        konteks: transaksi keuangan.
        rules:tanpa penjelasan, conversi text sesuai format, waktu default ${new Date().toDateString()} jika tidak ada dalam konteks, wajib ada activity dan total di dalam konteks, jika tidak return success:0.
        format: success:1|time:'YYYY-mm-dd'|total:number|category:'string'|activity:'string'|type: in/out
        text: ${content}
        `;
    return text;
};

export const extractGeminiText = (responseData: any): geminiResponse => {
    if (!responseData || !responseData.candidates?.length) {
        return { success: false };
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

    const obj: geminiResponse = { success: false };
    const pairs = texts[0].split("|");

    pairs.forEach((pair: string) => {
        const [key, value] = pair.split(":");
        switch (key) {
            case "success":
                obj.success = value === "1";
                break;
            case "time":
                obj.time = value;
                break;
            case "total":
                obj.total = Number(value);
                break;
            case "category":
                obj.category = value;
                break;
            case "activity":
                obj.activity = value;
                break;
            case "type":
                obj.is_out = value === "out";
                break;
        }
    });

    return obj;
};
