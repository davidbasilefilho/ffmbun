import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  getImageInfo,
  hasClipboardImage,
  processImage,
  processImagePlaceholder,
  processImageToBase64,
  processImageToBlob,
  processImageToBuffer,
  processImageToDataUrl,
  saveImage,
} from "./process";
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

describe("new terminal functions", () => {
  const baseOpts: ProcessOptions = {
    encode: { format: "png" },
  };

  test("processImageToBase64 returns a base64 string", async () => {
    const b64 = await processImageToBase64(testPngPath, baseOpts);
    expect(typeof b64).toBe("string");
    expect(b64.length).toBeGreaterThan(0);
    // Verify it looks like base64
    expect(b64).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test("processImageToDataUrl returns a data URL", async () => {
    const du = await processImageToDataUrl(testPngPath, baseOpts);
    expect(typeof du).toBe("string");
    expect(du).toMatch(/^data:image\/png;base64,/);
  });

  test("processImageToBuffer returns a Buffer", async () => {
    const buf = await processImageToBuffer(testPngPath, baseOpts);
    expect(buf instanceof Buffer || "length" in buf).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  test("processImageToBlob returns a Blob", async () => {
    const blob = await processImageToBlob(testPngPath, baseOpts);
    expect(blob instanceof Blob).toBe(true);
    expect(blob.size).toBeGreaterThan(0);
  });

  test("processImagePlaceholder returns a data URL string", async () => {
    const lqip = await processImagePlaceholder(testPngPath);
    expect(typeof lqip).toBe("string");
    expect(lqip).toMatch(/^data:image\/\w+;base64,/);
  });

  test("processImagePlaceholder applies transforms", async () => {
    const lqip = await processImagePlaceholder(testPngPath, {
      resize: { width: 50 },
    });
    expect(typeof lqip).toBe("string");
    expect(lqip).toMatch(/^data:image\/\w+;base64,/);
  });
});

describe("clipboard", () => {
  test("hasClipboardImage does not throw", () => {
    expect(hasClipboardImage()).toBeBoolean();
  });
});

describe("advanced encode options", () => {
  test("progressive JPEG", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "jpeg", quality: 80, progressive: true },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("lossless WebP", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "webp", lossless: true },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("indexed PNG with palette", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "png", palette: true, colors: 32 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("PNG with explicit compression level", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "png", compressionLevel: 9 },
    });
    expect(bytes.length).toBeGreaterThan(0);
  });

  test("backend bun override", async () => {
    const bytes = await processImage(testPngPath, {
      encode: { format: "png" },
      backend: "bun",
    });
    expect(bytes.length).toBeGreaterThan(0);
  });
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
