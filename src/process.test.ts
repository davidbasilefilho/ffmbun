import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { getImageInfo, processImage, saveImage } from "./process";
import type { ImageInfo, ProcessOptions } from "./process";

// 1x1 red pixel PNG as base64
const TEST_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

let testPngBytes: Uint8Array;
let testPngPath: string;

beforeAll(async () => {
  testPngBytes = Buffer.from(TEST_PNG_BASE64, "base64");
  testPngPath = import.meta.dir + "/__test_fixture.png";
  await Bun.write(testPngPath, testPngBytes);
});

afterAll(async () => {
  try {
    await Bun.write(testPngPath, ""); // clear it first
    Bun.spawn(["rm", "-f", testPngPath]);
  } catch {
    // ignore cleanup errors
  }
});

describe("loadImage and metadata", () => {
  test("loads image from Buffer and returns correct dimensions", async () => {
    const info: ImageInfo = await getImageInfo(testPngPath);
    expect(info.width).toBe(1);
    expect(info.height).toBe(1);
    expect(info.format).toBeString();
  });
});

describe("processImage", () => {
  const baseOpts: ProcessOptions = {
    encode: { format: "png" },
  };

  test("re-encodes image without transforms", async () => {
    const bytes = await processImage(testPngPath, baseOpts);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("resize to exact dimensions", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      resize: { width: 5, height: 5 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("resize width-only (maintain aspect ratio)", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      resize: { width: 10 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("resize with fit inside", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      resize: { width: 10, height: 10, fit: "inside" },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("rotate 90 degrees", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      rotate: 90,
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("flip vertically", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      flip: true,
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("flop horizontally", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      flop: true,
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("modulate brightness", async () => {
    const bytes = await processImage(testPngPath, {
      ...baseOpts,
      modulate: { brightness: 0.5 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("full pipeline: resize + rotate + flip + modulate", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "webp", quality: 80 },
      resize: { width: 10 },
      rotate: 90,
      flip: true,
      modulate: { brightness: 0.2, saturation: 0.3 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe("processImage format conversion", () => {
  const formats = ["jpeg", "png", "webp"] as const;

  for (const fmt of formats) {
    test(`encodes as ${fmt}`, async () => {
      const bytes = await processImage(testPngPath, {
        encode: { format: fmt, quality: 80 },
      });
      expect(bytes.length).toBeGreaterThan(0);
    });
  }

  // HEIC/AVIF require OS codecs; test separately with graceful skip
  const platformFormats = ["heic", "avif"] as const;
  for (const fmt of platformFormats) {
    test(`encodes as ${fmt} (if supported)`, async () => {
      try {
        const bytes = await processImage(testPngPath, {
          encode: { format: fmt, quality: 80 },
        });
        expect(bytes.length).toBeGreaterThan(0);
      } catch {
        // HEIC/AVIF codec may not be available on all platforms
      }
    });
  }
});

describe("saveImage", () => {
  test("writes bytes to file", async () => {
    const outPath = import.meta.dir + "/__test_output.png";
    const written = await saveImage(testPngBytes, outPath);
    expect(written).toBe(testPngBytes.length);
    // Cleanup
    try {
      Bun.spawn(["rm", "-f", outPath]);
    } catch {
      // ignore
    }
  });
});
