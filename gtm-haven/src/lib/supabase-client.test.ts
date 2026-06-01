import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseBrowserClient } from "./supabase-client";
import { createBrowserClient } from "@supabase/ssr";

// Mock the @supabase/ssr module to avoid actual client creation logic if any
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

describe("createSupabaseBrowserClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should throw an error if NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    expect(() => createSupabaseBrowserClient()).toThrowError();
  });

  it("should throw an error if NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "test-url";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(() => createSupabaseBrowserClient()).toThrowError();
  });

  it("should throw an error if both env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(() => createSupabaseBrowserClient()).toThrowError();
  });

  it("should create a browser client when environment variables are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "test-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith("test-url", "test-key");
  });
});
