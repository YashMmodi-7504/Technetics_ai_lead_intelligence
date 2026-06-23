import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isBcryptHash,
} from "../password";

describe("password service", () => {
  it("hashes to a bcrypt string and verifies correctly", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(isBcryptHash(hash)).toBe(true);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret-password");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("never verifies against a legacy base64 (non-bcrypt) hash", async () => {
    const legacy = Buffer.from("password").toString("base64");
    expect(isBcryptHash(legacy)).toBe(false);
    expect(await verifyPassword("password", legacy)).toBe(false);
  });

  it("produces unique hashes (salted) for the same password", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
});
