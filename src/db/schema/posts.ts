import { sql } from "drizzle-orm";
import {
	boolean,
	customType,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { NewsPostState } from "../../types";
import { editors } from "./editors";

/**
 * PostgreSQL `tsvector` column type for full-text search.
 * Updated manually whenever a new version is created.
 */
const _tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

/**
 * PostgreSQL enum mirroring {@linkcode NewsPostState}.
 */
export const newsPostStateEnum = pgEnum("news_post_state", [
	NewsPostState.Corrected,
	NewsPostState.UnderReview,
	NewsPostState.Verified,
	NewsPostState.Uncertain,
]);

/**
 * The canonical post record. Holds the current materialized state for fast reads.
 * All historical content lives in {@linkcode newsPostVersions}.
 */
export const newsPosts = pgTable("news_posts", {
	id: serial("id").primaryKey(),
	/**
	 * Publisher-provided endpoint. Frontend fetches publisher info from here.
	 * e.g. `some-news.org/853`
	 */
	publisherUrl: text("publisher_url").notNull(),
	/** Mirrors the state from the latest {@linkcode newsPostVersions} row. */
	state: newsPostStateEnum("state").notNull().default(
		NewsPostState.Uncertain,
	),
	/** Full CommonMark content. Never a diff. */
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
	index("posts_search_index").using(
		"gin",
		sql`to_tsvector('turkish', ${table.content})`,
	),
]);

/**
 * Full snapshot of a post at a point in time.
 * Every edit creates a new row — nothing is mutated.
 * To get current content, fetch the latest version by `postId`.
 */
export const newsPostVersions = pgTable("news_post_versions", {
	id: serial("id").primaryKey(),
	postId: integer("post_id")
		.notNull()
		.references(() => newsPosts.id, { onDelete: "cascade" }),
	editorId: integer("editor_id")
		.notNull()
		.references(() => editors.id),
	title: text("title").notNull(),
	/** Full CommonMark content. Never a diff. */
	content: text("content").notNull(),
	/** State of the post at this version. */
	state: newsPostStateEnum("state").notNull(),
	/** Required when `isSignificant` is true. Enforced at the service layer. */
	changeReason: text("change_reason"),
	/** Insignificant versions are hidden by default in history views. */
	isSignificant: boolean("is_significant").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
