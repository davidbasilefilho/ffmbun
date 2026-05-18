import { describe, expect, test } from "bun:test";

import { style } from "./style";

describe("style", () => {
  test("bold wraps text in ANSI bold sequences", () => {
    expect(style.bold("text")).toBe("\x1b[1mtext\x1b[22m");
  });

  test("dim wraps text in ANSI dim sequences", () => {
    expect(style.dim("text")).toBe("\x1b[2mtext\x1b[22m");
  });

  test("italic wraps text in ANSI italic sequences", () => {
    expect(style.italic("text")).toBe("\x1b[3mtext\x1b[23m");
  });

  test("underline wraps text in ANSI underline sequences", () => {
    expect(style.underline("text")).toBe("\x1b[4mtext\x1b[24m");
  });

  test("cyan wraps text in ANSI cyan sequences", () => {
    expect(style.cyan("text")).toBe("\x1b[36mtext\x1b[39m");
  });

  test("green wraps text in ANSI green sequences", () => {
    expect(style.green("text")).toBe("\x1b[32mtext\x1b[39m");
  });

  test("yellow wraps text in ANSI yellow sequences", () => {
    expect(style.yellow("text")).toBe("\x1b[33mtext\x1b[39m");
  });

  test("red wraps text in ANSI red sequences", () => {
    expect(style.red("text")).toBe("\x1b[31mtext\x1b[39m");
  });

  test("magenta wraps text in ANSI magenta sequences", () => {
    expect(style.magenta("text")).toBe("\x1b[35mtext\x1b[39m");
  });

  test("reset wraps text in ANSI reset sequences", () => {
    expect(style.reset("text")).toBe("\x1b[0mtext\x1b[0m");
  });

  test("empty string is handled gracefully", () => {
    expect(style.bold("")).toBe("\x1b[1m\x1b[22m");
    expect(style.cyan("")).toBe("\x1b[36m\x1b[39m");
    expect(style.red("")).toBe("\x1b[31m\x1b[39m");
  });
});
