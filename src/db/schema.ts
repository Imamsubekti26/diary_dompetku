import { relations, sql } from "drizzle-orm";
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";

export const chatrooms = table("chatrooms", {
    id: t.int().primaryKey({ autoIncrement: true }),
    lastBotMessageId: t.int("last_bot_message_id"),
    lastUserMessageId: t.int("last_user_message_id"),
    register_at: t
        .int({ mode: "timestamp" })
        .default(sql`(CURRENT_TIMESTAMP)`)
        .notNull(),
});

export const wallets = table("wallets", {
    id: t.int().primaryKey({ autoIncrement: true }),
    chatId: t
        .int("chat_id")
        .references(() => chatrooms.id)
        .notNull(),
    walletName: t.text("wallet_name").notNull(),
    isDefault: t
        .int("is_default", { mode: "boolean" })
        .notNull()
        .default(sql`0`),
});

export const categories = table("categories", {
    id: t.int().primaryKey({ autoIncrement: true }),
    chatId: t
        .int("chat_id")
        .references(() => chatrooms.id)
        .notNull(),
    categoryName: t.text("category_name").notNull(),
});

export const transactions = table("transactions", {
    id: t.int().primaryKey({ autoIncrement: true }),
    chatId: t
        .int("chat_id")
        .references(() => chatrooms.id)
        .notNull(),
    messageId: t.int("messageId").notNull(),
    categoryId: t
        .int("category_id")
        .references(() => categories.id)
        .notNull(),
    walletId: t
        .int("wallet_id")
        .references(() => wallets.id)
        .notNull(),
    isSuccess: t.int("is_success", { mode: "boolean" }).notNull(),
    activity: t.text().notNull(),
    date: t.int({ mode: "timestamp" }).notNull(),
    type: t
        .text({ enum: ["in", "out"] })
        .notNull()
        .default("out"),
    nominal: t.int().notNull(),
    verifiedAt: t.int("verified_at", { mode: "timestamp" }),
});

export const chatroomsRelations = relations(chatrooms, ({ many }) => ({
    wallets: many(wallets),
    categories: many(categories),
    transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
    transactions: many(transactions),
    chatroom: one(chatrooms, {
        fields: [wallets.chatId],
        references: [chatrooms.id],
    }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    transactions: many(transactions),
    chatroom: one(chatrooms, {
        fields: [categories.chatId],
        references: [chatrooms.id],
    }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    chatroom: one(chatrooms, {
        fields: [transactions.chatId],
        references: [chatrooms.id],
    }),
    wallet: one(wallets, {
        fields: [transactions.walletId],
        references: [wallets.id],
    }),
    categorie: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
}));
