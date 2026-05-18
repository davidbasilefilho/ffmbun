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
});

describe("readInput", () => {
  test("throws on nonexistent file", async () => {
    expect(readInput("nonexistent.png")).rejects.toThrow();
  });
});
