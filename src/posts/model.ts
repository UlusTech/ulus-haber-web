import type { PgSerial } from "drizzle-orm/pg-core";

import type { Editor } from "../auth/schema";

export enum NewsPostState {
    /**
     * Changed after {@linkcode UnderReview}
     */
    Corrected = "corrected",
    /**
     * Reviewing {@linkcode Uncertain}
     */
    UnderReview = "under_review",
    /**
     * Verifyed and proven to be true. Still, it can get {@linkcode UnderReview} and {@linkcode Corrected} and verifyed agein
     */
    Verified = "verified",
    /**
     * Not Reviewed. Maybe no way to correct or verify and cant get it {@linkcode UnderReview}
     */
    Uncertain = "uncertain",
}

/**
 * The canonical post record. Holds the current materialized state for fast reads.
 * All historical content lives in {@linkcode NewsPostVersion}.
 */
export type NewsPost = {
    /**
     * See `serial` from `drizzle-orm/pg-core`. {@linkcode PgSerial}
     */
    id: number;
    /**
     * Publishers gives url of thier publisher server.
     */
    publisherUrl: URL;
    /**
     * Defaults {@linkcode NewsPostState.Uncertain}.
     */
    state: NewsPostState;
    /**
     * In CammonMark markdown format.
     * Footnotes are rendered in an collapsed way. Treat them as sources or references.
     */
    content: string;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Full snapshot of a post at a point in time.
 * Every edit creates a new row — nothing is mutated.
 * To get current content, fetch the latest version by `postId`.
 */
export type NewsPostVersion = {
    /**
     * See `serial` from `drizzle-orm/pg-core`. {@linkcode PgSerial}
     */
    id: number;
    postId: NewsPost["id"];
    editorId: Editor["id"];
    content: string;
    state: NewsPostState;
    isSignificant: boolean;
    /**
     * Acts like a commit message.
     */
    message: string;
    /**
     * Null means visible to public.
     * String is the editor's reason for suppressing this version.
     * The materialized current state on {@linkcode NewsPost} is always shown —
     * moderation only applies to the version history view.
     * Editors push a corrected version first, then moderate the bad one(s).
     */
    moderated: null | string;
    createdAt: Date;
};
