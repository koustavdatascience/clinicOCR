import { afterEach, describe, expect, it } from "vitest";
import { storageGet } from "./storage";

const initialStorageProvider = process.env.STORAGE_PROVIDER;

afterEach(() => {
  if (initialStorageProvider === undefined) delete process.env.STORAGE_PROVIDER;
  else process.env.STORAGE_PROVIDER = initialStorageProvider;
});

describe("external storage routing", () => {
  it("uses the protected same-origin API path when configured for S3-compatible storage", async () => {
    process.env.STORAGE_PROVIDER = "s3";
    await expect(storageGet("prescriptions/original.png")).resolves.toEqual({
      key: "prescriptions/original.png",
      url: "/api/storage/prescriptions/original.png",
    });
  });

  it("retains the Manus storage path for existing deployments", async () => {
    delete process.env.STORAGE_PROVIDER;
    await expect(storageGet("prescriptions/original.png")).resolves.toEqual({
      key: "prescriptions/original.png",
      url: "/manus-storage/prescriptions/original.png",
    });
  });
});
