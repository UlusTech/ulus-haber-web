import { createSelectSchema } from "drizzle-zod";
import { editors } from "../db/schema/editors";
import type { NewsPost } from "../posts/schema";
import type { ZodSatisfies } from "../types";

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
    /**
     * The name or nickname of the Editor.
     */
    name: string;
    /**
     * Org email, e.g. `atilla@haber.ulus.org.tr`
     */
    email: string;
    /**
     * TOTP secret for authenticator app. Set once on account creation.
     */
    totpSecret: string;
    /**
     * When the account of this editor is created
     */
    createdAt: Date;
};

/**
 * Separate satisfies check avoids the deep instantiation error.
 * {@linkcode EditorSchema}
 */
const _EditorSchema = createSelectSchema(editors, {
    id: (schema) => schema.describe("Serial primary key."),
    name: (schema) =>
        schema
            .min(1)
            .describe("The name or nickname of the editor."),
    email: (schema) =>
        schema
            .email()
            .describe("Org email, e.g. `atilla@haber.ulus.org.tr`"),
    totpSecret: (schema) =>
        schema
            .describe(
                "TOTP secret for authenticator app. Set once on account creation.",
            ),
    createdAt: (schema) =>
        schema
            .describe("When the account of this editor is created."),
});

export const EditorSchema: ZodSatisfies<Editor> = _EditorSchema;

const someEditor = {
    id: 1,
    name: "Whoam",
    email: "whoam@ulus.org.tr",
    totpSecret: "somethingSomething",
    createdAt: new Date(),
};

EditorSchema.parse(someEditor);

/**
 * Active editor sessions. The `id` itself is the token sent in requests.
 * Sessions expire after 7 days. Expired sessions are never auto-cleaned —
 * check `expiresAt` on every authenticated request.
 */
export type Session = {
    /**
     * Random token. This is what the client sends as a bearer token.
     */
    id: string;
    /**
     * The id of the {@linkcode Editor}.
     */
    editorId: Editor["id"];
    /**
     * Can change. Trusted ip will not have Rate-limiting.
     */
    ip: string;
    /**
     * Never changes by desing.
     */
    userAgent: string;
    /**
     * Sessions expire after 7 days.
     */
    expiresAt: Date;
    /**
     * TODO: Remove this if {@linkcode Session.expiresAt} is enough.
     */
    createdAt: Date;
};

/**
 * The data of an session check.
 *
 * If we do not trust the ip, we send valid but not trusted. If we see userAgent different, we send not trusted, and invalid.
 * But if the session expires, we send invalid but trusted.
 * _The {@linkcode Readonly} version of {@linkcode SessionCheckData}._
 */
export type SessionCheckResponse = Readonly<{
    /**
     * If true, we trust the session.
     * If false, we do not. Log or alarm.
     */
    trusted: boolean;
    /**
     * If true, we let the editor in.
     * If false, we keep IT outside.
     */
    valid: boolean;
}>;
