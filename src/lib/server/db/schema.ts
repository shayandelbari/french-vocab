import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
    integer,
    jsonb,
    pgEnum,
    index,
    primaryKey,
} from "drizzle-orm/pg-core";

export const wordKindEnum = pgEnum("word_kind", [
    "noun",
    "verb",
    "adjective",
    "adverb",
    "phrase",
    "other",
]);

export const genderEnum = pgEnum("gender_type", ["m", "f", "none"]);

export const exposureSourceEnum = pgEnum("exposure_source", [
    "my_list",
    "global_list",
    "search",
    "practice_session",
    "manual_view",
]);

export const words = pgTable(
    "words",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        french: text("french").notNull(),
        frenchNormalized: text("french_normalized").notNull(),
        translation: text("translation"),
        kind: wordKindEnum("kind").notNull().default("other"),
        gender: genderEnum("gender").notNull().default("none"),
        exampleSentence: text("example_sentence"),
        audioUrl: text("audio_url"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (t) => [
        index("ux_words_french_normalized").on(
            t.frenchNormalized
        ),
    ]
);

export const adminLists = pgTable(
    "admin_lists",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        description: text("description"),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (t) => [
        index("idx_admin_lists_name").on(t.name),
    ]
);

export const adminListWords = pgTable(
    "admin_list_words",
    {
        listId: uuid("list_id")
            .notNull()
            .references(() => adminLists.id, { onDelete: "cascade" }),
        wordId: uuid("word_id")
            .notNull()
            .references(() => words.id, { onDelete: "restrict" }),
        position: integer("position"),
        addedAt: timestamp("added_at", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (t) => [
        primaryKey({ columns: [t.listId, t.wordId] }),
        index("idx_admin_list_words_list").on(t.listId),
        index("idx_admin_list_words_word").on(t.wordId),
    ]
);

export const userWords = pgTable(
    "user_words",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id").notNull(), // Clerk user ID
        wordId: uuid("word_id")
            .notNull()
            .references(() => words.id, { onDelete: "restrict" }),
        addedAt: timestamp("added_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        addedVia: text("added_via"),
        notes: text("notes"),
        seenCount: integer("seen_count").notNull().default(0),
        lastSeen: timestamp("last_seen", { withTimezone: true }).$onUpdate(() => new Date()),
        active: boolean("active").notNull().default(true),
    },
    (t) => [
        index("ux_user_words_user_word").on(
            t.userId,
            t.wordId
        ),
        index("idx_user_words_active").on(t.userId, t.active),
        index("idx_user_words_last_seen").on(
            t.userId,
            t.lastSeen
        ),
    ]
);

export const exposures = pgTable(
    "exposures",
    {
        userId: text("user_id").notNull(), // Clerk user ID
        wordId: uuid("word_id")
            .notNull()
            .references(() => words.id, { onDelete: "cascade" }),
        firstSeen: timestamp("first_seen", { withTimezone: true })
            .defaultNow()
            .notNull(),
        lastSeen: timestamp("last_seen", { withTimezone: true })
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date()),
        seenCount: integer("seen_count").notNull().default(1),
        lastSource: exposureSourceEnum("last_source").default("manual_view"),
        lastContext: text("last_context"),
    },
    (t) => [
        primaryKey({ columns: [t.userId, t.wordId] }),
        index("idx_exposures_recent").on(
            t.userId,
            t.lastSeen
        ),
    ]
);

export const practiceLogs = pgTable(
    "practice_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: text("user_id").notNull(), // Clerk user ID
        wordId: uuid("word_id")
            .notNull()
            .references(() => words.id, { onDelete: "cascade" }),
        sourceListId: uuid("source_list_id").references(
            () => adminLists.id,
            { onDelete: "set null" }
        ),
        fromMyList: boolean("from_my_list").notNull().default(false),
        result: boolean("result"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => [
        index("idx_practice_logs_user_time").on(
            t.userId,
            t.createdAt
        ),
        index("idx_practice_logs_word").on(t.wordId),
    ]
);
