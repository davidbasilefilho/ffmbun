import { describe, expect, test } from "bun:test";

import { parseArgs, readInput } from "./utils";

describe("parseArgs", () => {
  test("returns defaults for empty args", () => {
    const opts = parseArgs([]);
    expect(opts.file).toBeUndefined();
    expect(opts.outFile).toBeUndefined();
    expect(opts.resize).toBeUndefined();
    expect(opts.fit).toBe("fill");
    expect(opts.filter).toBeUndefined();
    expect(opts.rotate).toBeUndefined();
    expect(opts.flip).toBe(false);
    expect(opts.flop).toBe(false);
    expect(opts.format).toBeUndefined();
    expect(opts.quality).toBeUndefined();
    expect(opts.brightness).toBeUndefined();
    expect(opts.saturation).toBeUndefined();
    expect(opts.hue).toBeUndefined();
    expect(opts.lightness).toBeUndefined();
    expect(opts.info).toBe(false);
    expect(opts.withoutEnlargement).toBe(false);
    expect(opts.version).toBe(false);
    expect(opts.help).toBe(false);
    // New defaults
    expect(opts.overwrite).toBe(false);
    expect(opts.placeholder).toBe(false);
    expect(opts.base64).toBe(false);
    expect(opts.dataurl).toBe(false);
    expect(opts.clipboard).toBe(false);
    expect(opts.backend).toBeUndefined();
    expect(opts.progressive).toBe(false);
    expect(opts.lossless).toBe(false);
    expect(opts.palette).toBe(false);
    expect(opts.colors).toBeUndefined();
    expect(opts.compressionLevel).toBeUndefined();
  });

  test("parses boolean flags", () => {
    expect(parseArgs(["--flip"]).flip).toBe(true);
    expect(parseArgs(["--flop"]).flop).toBe(true);
    expect(parseArgs(["--info"]).info).toBe(true);
    expect(parseArgs(["--without-enlargement"]).withoutEnlargement).toBe(true);
    expect(parseArgs(["--version"]).version).toBe(true);
    expect(parseArgs(["-v"]).version).toBe(true);
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
  });

  test("parses value flags", () => {
    expect(parseArgs(["--out", "out.png"]).outFile).toBe("out.png");
    expect(parseArgs(["-o", "out.jpg"]).outFile).toBe("out.jpg");
    expect(parseArgs(["--resize", "800x600"]).resize).toBe("800x600");
    expect(parseArgs(["--resize", "800"]).resize).toBe("800");
    expect(parseArgs(["--fit", "inside"]).fit).toBe("inside");
    expect(parseArgs(["--filter", "mitchell"]).filter).toBe("mitchell");
    expect(parseArgs(["--rotate", "90"]).rotate).toBe(90);
    expect(parseArgs(["--format", "webp"]).format).toBe("webp");
    expect(parseArgs(["--quality", "85"]).quality).toBe(85);
    expect(parseArgs(["--brightness", "0.5"]).brightness).toBe(0.5);
    expect(parseArgs(["--saturation", "-0.3"]).saturation).toBe(-0.3);
    expect(parseArgs(["--hue", "180"]).hue).toBe(180);
    expect(parseArgs(["--lightness", "0.2"]).lightness).toBe(0.2);
  });

  test("parses positional file argument", () => {
    expect(parseArgs(["photo.jpg"]).file).toBe("photo.jpg");
  });

  test("parses file before flags", () => {
    const opts = parseArgs(["photo.jpg", "--format", "png"]);
    expect(opts.file).toBe("photo.jpg");
    expect(opts.format).toBe("png");
  });

  test("throws on unknown flag", () => {
    expect(() => parseArgs(["--unknown"])).toThrow();
  });

  test("throws on invalid numeric value", () => {
    expect(() => parseArgs(["--quality", "abc"])).toThrow();
  });

  test("throws on out-of-range quality", () => {
    expect(() => parseArgs(["--quality", "101"])).toThrow();
    expect(() => parseArgs(["--quality", "0"])).toThrow();
  });

  test("parses combined flags correctly", () => {
    const opts = parseArgs([
      "input.jpg",
      "--resize",
      "800",
      "--rotate",
      "90",
      "--flip",
      "--format",
      "webp",
      "--quality",
      "90",
      "-o",
      "out.webp",
    ]);
    expect(opts.file).toBe("input.jpg");
    expect(opts.resize).toBe("800");
    expect(opts.rotate).toBe(90);
    expect(opts.flip).toBe(true);
    expect(opts.format).toBe("webp");
    expect(opts.quality).toBe(90);
    expect(opts.outFile).toBe("out.webp");
  });

  // ── ffmpeg-compatible flags ──

  test("ffmpeg -i flag sets input file", () => {
    const opts = parseArgs(["-i", "photo.jpg"]);
    expect(opts.file).toBe("photo.jpg");
  });

  test("ffmpeg -i with positional output", () => {
    const opts = parseArgs(["-i", "input.jpg", "output.jpg"]);
    expect(opts.file).toBe("input.jpg");
    expect(opts.outFile).toBe("output.jpg");
  });

  test("ffmpeg -s flag sets resize", () => {
    expect(parseArgs(["-s", "800"]).resize).toBe("800");
    expect(parseArgs(["-s", "800x600"]).resize).toBe("800x600");
  });

  test("ffmpeg -vf scale filter", () => {
    const opts = parseArgs(["-vf", "scale=800:-1"]);
    expect(opts.resize).toBe("800");
    expect(opts.vfFilters).toHaveLength(1);
    expect(opts.vfFilters[0]!.type).toBe("scale");
  });

  test("ffmpeg -vf with multiple filters", () => {
    const opts = parseArgs(["-vf", "scale=800:600,hflip"]);
    expect(opts.resize).toBe("800x600");
    expect(opts.flop).toBe(true);
    expect(opts.vfFilters).toHaveLength(2);
  });

  test("ffmpeg -vf vflip", () => {
    const opts = parseArgs(["-vf", "vflip"]);
    expect(opts.flip).toBe(true);
  });

  test("ffmpeg -vf transpose=1 (90° CW)", () => {
    const opts = parseArgs(["-vf", "transpose=1"]);
    expect(opts.rotate).toBe(90);
  });

  test("ffmpeg -vf hue filter", () => {
    const opts = parseArgs(["-vf", "hue=H=45:s=0.5"]);
    expect(opts.hue).toBe(45);
    expect(opts.saturation).toBe(0.5);
  });

  test("ffmpeg -vf eq filter", () => {
    const opts = parseArgs(["-vf", "eq=brightness=0.2:saturation=0.8"]);
    expect(opts.brightness).toBe(0.2);
    expect(opts.saturation).toBe(0.8);
  });

  test("ffmpeg -q:v sets quality", () => {
    expect(parseArgs(["-q:v", "85"]).quality).toBe(85);
  });

  test("ffmpeg -c:v libwebp maps to webp format", () => {
    const opts = parseArgs(["-c:v", "libwebp"]);
    expect(opts.format).toBe("webp");
  });

  test("ffmpeg -c:v mjpeg maps to jpeg", () => {
    const opts = parseArgs(["-c:v", "mjpeg"]);
    expect(opts.format).toBe("jpeg");
  });

  test("ffmpeg -f webp sets format", () => {
    expect(parseArgs(["-f", "webp"]).format).toBe("webp");
  });

  test("ffmpeg -f mjpeg sets format", () => {
    expect(parseArgs(["-f", "mjpeg"]).format).toBe("jpeg");
  });

  test("ffmpeg -f image2 is skipped (unsupported)", () => {
    expect(parseArgs(["-f", "image2"]).format).toBeUndefined();
  });

  test("ffmpeg -f rawvideo is skipped (unsupported)", () => {
    expect(parseArgs(["-f", "rawvideo"]).format).toBeUndefined();
  });

  test("ffmpeg -y sets overwrite", () => {
    expect(parseArgs(["-y"]).overwrite).toBe(true);
  });

  test("ffmpeg -c:v takes priority over -f", () => {
    const opts = parseArgs(["-f", "webp", "-c:v", "mjpeg"]);
    expect(opts.format).toBe("jpeg");
  });

  test("ffmpeg-style combined: -i + -vf + -q:v + positional output", () => {
    const opts = parseArgs(["-i", "in.jpg", "-vf", "scale=800:-1,hflip", "-q:v", "90", "out.webp"]);
    expect(opts.file).toBe("in.jpg");
    expect(opts.resize).toBe("800");
    expect(opts.flop).toBe(true);
    expect(opts.quality).toBe(90);
    expect(opts.outFile).toBe("out.webp");
  });

  test("ffmpeg-style: --codec:v alias", () => {
    expect(parseArgs(["--codec:v", "png"]).format).toBe("png");
  });

  test("ffmpeg-style: --c:v alias", () => {
    expect(parseArgs(["--c:v", "libwebp"]).format).toBe("webp");
  });

  // ── New feature flags ──

  test("parses --placeholder", () => {
    expect(parseArgs(["--placeholder"]).placeholder).toBe(true);
  });

  test("parses --base64", () => {
    expect(parseArgs(["--base64"]).base64).toBe(true);
  });

  test("parses --dataurl", () => {
    expect(parseArgs(["--dataurl"]).dataurl).toBe(true);
  });

  test("parses --clipboard", () => {
    expect(parseArgs(["--clipboard"]).clipboard).toBe(true);
  });

  test("parses --backend", () => {
    expect(parseArgs(["--backend", "bun"]).backend).toBe("bun");
    expect(parseArgs(["--backend", "system"]).backend).toBe("system");
  });

  test("parses --progressive", () => {
    expect(parseArgs(["--progressive"]).progressive).toBe(true);
  });

  test("parses --lossless", () => {
    expect(parseArgs(["--lossless"]).lossless).toBe(true);
  });

  test("parses --palette", () => {
    expect(parseArgs(["--palette"]).palette).toBe(true);
  });

  test("parses --colors", () => {
    expect(parseArgs(["--colors", "64"]).colors).toBe(64);
  });

  test("parses --compression-level", () => {
    expect(parseArgs(["--compression-level", "9"]).compressionLevel).toBe(9);
  });

  test("parses --dither", () => {
    expect(parseArgs(["--dither"]).dither).toBe(true);
  });
});

describe("readInput", () => {
  test("throws on nonexistent file", async () => {
    expect(readInput("nonexistent.png")).rejects.toThrow();
  });
});
