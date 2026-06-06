import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { httpUrlSchema } from "./schemas";

/**
 * Independent oracle for `httpUrlSchema`.
 *
 * The schema is `z.string().url().max(2048).refine(/^https?:\/\//i)`. Zod v4's
 * `.url()` check is equivalent to "the WHATWG `new URL(value)` constructor does
 * not throw" (verified empirically against zod over tens of thousands of varied
 * inputs). So a string is accepted iff:
 *   1. it parses as a URL (`new URL` succeeds),
 *   2. its length does not exceed 2,048 characters, and
 *   3. it begins with an http or https scheme.
 */
function isAcceptable(value: string): boolean {
  if (value.length > 2048) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

describe("httpUrlSchema", () => {
  // Feature: preintent-security-quality-hardening, Property 1: URL field accept-iff-valid
  it("Property 1: accepts a string iff it is a valid http(s) URL of length <= 2048", () => {
    // Validates: Requirements 1.5, 1.9
    const validHttpUrl = fc.webUrl({
      withQueryParameters: true,
      withFragments: true,
    });

    // Non-http(s) scheme URLs (syntactically valid URLs that must be rejected).
    const otherSchemeUrl = fc
      .tuple(
        fc.constantFrom("ftp", "ws", "wss", "mailto", "file", "tel", "data"),
        fc.domain(),
      )
      .map(([scheme, host]) => `${scheme}://${host}`);

    // Plain strings that are almost never valid URLs.
    const nonUrl = fc.string();

    // http(s) URLs deliberately pushed beyond the 2,048 character ceiling.
    const overLongUrl = fc
      .integer({ min: 2049, max: 4096 })
      .map((len) => `https://example.com/${"a".repeat(len)}`);

    const anyInput = fc.oneof(
      { weight: 4, arbitrary: validHttpUrl },
      { weight: 2, arbitrary: otherSchemeUrl },
      { weight: 3, arbitrary: nonUrl },
      { weight: 1, arbitrary: overLongUrl },
    );

    fc.assert(
      fc.property(anyInput, (input) => {
        const accepted = httpUrlSchema.safeParse(input).success;
        expect(accepted).toBe(isAcceptable(input));
      }),
      { numRuns: 100 },
    );
  });
});
