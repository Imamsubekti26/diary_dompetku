import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

export const registerNewChat = async (
    db: DrizzleD1Database<typeof schema>,
    chatId: number,
) => {
    const registerAt = new Date();
    try {
        // cek apa sudah pernah terdaftar
        const exist = await db
            .select()
            .from(schema.chatrooms)
            .where(eq(schema.chatrooms.id, chatId))
            .get();
        if (exist) return true;

        // masukkan ke chatrooms
        const newChatroom = {
            id: chatId,
            register_at: registerAt,
        };
        await db.insert(schema.chatrooms).values(newChatroom);

        // buatkan default walletnya
        const walletList = ["Cash", "Bank BCA", "Dana"];
        const defaultWallet = "Cash";
        const newWallets = walletList.map((wallet) => ({
            walletName: wallet,
            chatId: chatId,
            isDefault: wallet === defaultWallet,
        }));
        await db.insert(schema.wallets).values(newWallets);

        // buatkan default categorynya
        const categoryList = [
            "Lain-lain",
            "Makanan",
            "Transportasi",
            "Hiburan",
            "Akomondasi",
            "Belanja",
        ];
        const newCategories = categoryList.map((category) => ({
            chatId: chatId,
            categoryName: category,
        }));
        await db.insert(schema.categories).values(newCategories);

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};
