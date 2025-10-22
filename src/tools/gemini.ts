type geminiConfig = {
    apiKey: string;
};

type geminiResponse = {
    success: boolean;
    time?: string;
    total?: number;
    category?: string;
    activity?: string;
    type?: string;
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
            system_instruction: {
                parts: [{ text: systemInstruction() }],
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

const systemInstruction = () => {
    const text = `
        Konteks: transaksi keuangan.
        hari ini: ${new Date().toDateString()}.
        Aturan:
        - tanpa penjelasan;
        - bisa lebih dari satu hasil;
        - waktu default: hari ini jika tidak disebut;
        - tipe pesan: in/out/summary;
        - in/out: pada text, wajib ada activity & total; jika tidak ada, hasil [{success:false,type:out}];
        - tipe summary: gunakan rentang tanggal, default minggu ini;
        Format:
        in/out → [{success:true,time:'YYYY-mm-dd',total:number,category:'string',activity:'string',type:in/out}]
        summary → [{success:true,type:summary,from:'YYYY-mm-dd',to:'YYYY-mm-dd'}]
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
