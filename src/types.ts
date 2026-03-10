import type { PgSerial } from "drizzle-orm/pg-core";

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

/**
 * Internal editors who can create and modify {@linkcode NewsPost}.
 * Accounts are created manually via seed script.
 * Auth is TOTP-based, no passwords stored.
 */
export type Editor = {
    /**
     * See `serial` from `drizzle-orm/pg-core`. {@linkcode PgSerial}
     */
    id: number;
    name: string;
    /** Org email, e.g. `atilla@haber.ulus.org.tr` */
    email: string;
    /** TOTP secret for authenticator app. Set once on account creation. */
    totpSecret: string;
    createdAt: Date;
};

/**
 * Active editor sessions. The `id` itself is the token sent in requests.
 * Sessions expire after 7 days. Expired sessions are never auto-cleaned —
 * check `expiresAt` on every authenticated request.
 */
export type Sessions = {
    /** Random token. This is what the client sends as a bearer token. */
    id: string;
    editorId: Editor["id"];
    /** Can change. Trusted ip will not have Rate-limiting. */
    ip: string;
    /** Never changes by desing. */
    userAgent: string;
    expiresAt: Date;
    updatedAt: Date;
};
