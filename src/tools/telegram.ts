export const generateSuccessMessage = (data: Array<object>) => {
    const formatted = data
        .map((item: any) => {
            const isIncome = item.type === "in";
            const title = isIncome ? "🟢 Uang masuk" : "🔴 Uang keluar";
            const nominal = `${item.total?.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}`;
            const date = `${new Date(item.time || "").toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`;

            return (
                `*${title}: ${nominal}*\n` +
                `- *Keterangan*: ${item.activity}\n` +
                `- *Kategori*: ${item.category}\n` +
                `- *Dompet*: Cash\n` +
                `- *Tanggal*: ${date}\n`
            );
        })
        .join("\n\n");

    return `Berikut rincian transaksimu:\n\n${formatted}\n\nKetik *YA* untuk mengkonfirmasi, atau command /edit diikuti pesan untuk mengedit.`;
};

const baseMessageResponse = async (
    url: string,
    data: object,
) => {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(
                `Telegram API error: ${response.status} ${response.statusText}`,
            );
        }

        const result: any = await response.json();
        if (!result.ok && !result.result?.message_id) {
            throw new Error(
                `Telegram API error: ${result.error_code} ${result.description}`,
            );
        }

        return result.result.message_id;
    } catch (error) {
        console.error("Error sending message:", error);
        return null;
    }
};

export const sendMessage = async (token: string, chatId: string, message: string) => {
    return await baseMessageResponse(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
        },
    );
};

export const updateMessage = async (token: string, chatId: string, messageId: string, message: string) => {
    return await baseMessageResponse(
        `https://api.telegram.org/bot${token}/editMessageText`,
        {
            chat_id: chatId,
            message_id: messageId,
            text: message,
            parse_mode: "Markdown",
        },
    );
};
