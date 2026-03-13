import type z from "zod";

// TODO: Move to tstd later.
export type Satisfies<TCheck, TAgainst> = TCheck extends TAgainst ? TCheck
    : never;

/**
 * Constrains both the inferred output and the allowed input
 * of a Zod schema to exactly `Shape`.
 *
 * Use with the TypeScript `satisfies` operator for compile-time
 * exhaustiveness checking without any runtime overhead.
 *
 * Recommended to combine with {@link PrettifyZodInfer} for
 * prettified inference results.
 *
 * @example
 * ```ts
 * import { z } from "zod/v4";
 *
 * type TestNested = { testString: string };
 * type Test = { test: TestNested };
 *
 * const testNestedSchema = z.object({
 *   testString: z.string(),
 * }) satisfies ZodSatisfies<TestNested>;
 *
 * const testSchema = z.object({
 *   test: testNestedSchema,
 * }) satisfies ZodSatisfies<Test>;
 * ```
 *
 * TODO: Move to tstd later.
 */
export type ZodSatisfies<Shape> = z.ZodType<Shape, Shape>;

/**
 * “Prettify” a Zod schema’s inference so it collapses to exactly
 * your declared `PrettyType`, improving hover-text readability
 * and ensuring your inferred type matches your expectation.
 *
 * Requires your schema to also satisfy {@linkcode ZodSatisfies<PrettyType>}.
 *
 * @typeParam PrettyType — the type you want {@linkcode z.infer} to collapse to
 * @typeParam SchemaType — your schema, constrained to {@linkcode z.ZodType<PrettyType, PrettyType>}
 *
 * @example
 * ```ts
 * import { z } from "zod/v4";
 * type Nested = { a: number };
 * type Outer = { nested: Nested };
 *
 * const nestedSchema = z.object({ a: z.number() }) satisfies ZodSatisfies<Nested>;
 *
 * const outerSchema = z.object({ nested: nestedSchema }) satisfies ZodSatisfies<
 *   Outer
 * >;
 *
 * type RawInfer = z.infer<typeof outerSchema>; // { nested: { a: number } }
 * type PrettyInfer = PrettifyZodInfer<Outer, typeof outerSchema>;
 * // now exactly Outer
 * ```
 *
 * TODO: Move to tstd later.
 */
export type PrettifyZodInfer<
    PrettyType,
    SchemaType extends z.ZodType<PrettyType, PrettyType>,
> = z.infer<SchemaType> extends PrettyType ? PrettyType : never;
