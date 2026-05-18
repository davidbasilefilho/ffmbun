import { z } from "zod";

import pkg from "../package.json" with { type: "json" };
import { style } from "./style";

export const CLI_NAME = "ffmbun";
const CLI_HELP_CMD = `${CLI_NAME} --help`;

const BANNER = `${style.bold(style.cyan(CLI_NAME))} ${style.dim("\u2014")} ${style.italic("An alternative to ffmpeg using Bun\u2019s image capabilities")}`;

const USAGE = `
${BANNER}

${style.bold("USAGE")}
  ${style.cyan(CLI_NAME)} ${style.dim("[options]")} ${style.yellow("<file>")}

${style.bold("OPTIONS")}
  ${style.cyan("--out")}, ${style.cyan("-o")} ${style.yellow("<file>")}    ${style.dim("Write output to file instead of stdout")}
  ${style.cyan("--resize")} ${style.yellow("<WxH>")}      ${style.dim('Resize image (e.g. "800" or "800x600")')}
  ${style.cyan("--fit")} ${style.yellow("<mode>")}        ${style.dim("Fit mode: fill, inside (default: fill)")}
  ${style.cyan("--filter")} ${style.yellow("<name>")}     ${style.dim("Resampling filter: lanczos3, lanczos2, mitchell, cubic, bilinear, nearest")}
  ${style.cyan("--rotate")} ${style.yellow("<deg>")}      ${style.dim("Rotate (90, 180, 270)")}
  ${style.cyan("--flip")}              ${style.dim("Flip vertically")}
  ${style.cyan("--flop")}              ${style.dim("Flop horizontally")}
  ${style.cyan("--format")} ${style.yellow("<fmt>")}      ${style.dim("Output format: jpeg, png, webp, heic, avif")}
  ${style.cyan("--quality")} ${style.yellow("<n>")}       ${style.dim("Quality for lossy formats (1\u2013100)")}
  ${style.cyan("--brightness")} ${style.yellow("<n>")}    ${style.dim("Adjust brightness (\u22121 to 1)")}
  ${style.cyan("--saturation")} ${style.yellow("<n>")}    ${style.dim("Adjust saturation (\u22121 to 1)")}
  ${style.cyan("--hue")} ${style.yellow("<n>")}           ${style.dim("Adjust hue (0\u2013360)")}
  ${style.cyan("--lightness")} ${style.yellow("<n>")}     ${style.dim("Adjust lightness (\u22121 to 1)")}
  ${style.cyan("--info")}              ${style.dim("Show image metadata and exit")}
  ${style.cyan("--without-enlargement")} ${style.dim("Never upscale when resizing")}
  ${style.cyan("--version")}, ${style.cyan("-v")}        ${style.dim("Show version")}
  ${style.cyan("--help")}, ${style.cyan("-h")}           ${style.dim("Show this help")}

${style.bold("EXAMPLES")}
  ${style.dim("# Convert an image to WebP")}
  ${style.cyan(CLI_NAME)} ${style.yellow("photo.jpg")} ${style.cyan("--format")} ${style.yellow("webp")} ${style.cyan("-o")} ${style.yellow("photo.webp")}

  ${style.dim("# Resize to 800px width")}
  ${style.cyan(CLI_NAME)} ${style.yellow("photo.jpg")} ${style.cyan("--resize")} ${style.yellow("800")} ${style.cyan("-o")} ${style.yellow("thumb.jpg")}

  ${style.dim("# Rotate and flip")}
  ${style.cyan(CLI_NAME)} ${style.yellow("photo.jpg")} ${style.cyan("--rotate")} ${style.yellow("90")} ${style.cyan("--flip")} ${style.cyan("-o")} ${style.yellow("rotated.jpg")}

  ${style.dim("# Show image metadata")}
  ${style.cyan(CLI_NAME)} ${style.yellow("photo.jpg")} ${style.cyan("--info")}

  ${style.dim("# Pipe from stdin")}
  ${style.dim("cat photo.jpg |")} ${style.cyan(CLI_NAME)} ${style.cyan("--format")} ${style.yellow("png")} ${style.cyan("-o")} ${style.yellow("out.png")}
`;

export const FIT_MODES = ["fill", "inside"] as const;
export type FitMode = (typeof FIT_MODES)[number];

export const RESAMPLE_FILTERS = [
  "lanczos3",
  "lanczos2",
  "mitchell",
  "cubic",
  "bilinear",
  "nearest",
] as const;
export type ResampleFilter = (typeof RESAMPLE_FILTERS)[number];

export const OUTPUT_FORMATS = ["jpeg", "png", "webp", "heic", "avif"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

const CliOptionsSchema = z.object({
  file: z.string().optional(),
  outFile: z.string().optional(),
  resize: z.string().optional(),
  fit: z.enum(FIT_MODES).default("fill"),
  filter: z.enum(RESAMPLE_FILTERS).optional(),
  rotate: z.coerce.number().optional(),
  flip: z.boolean().default(false),
  flop: z.boolean().default(false),
  format: z.enum(OUTPUT_FORMATS).optional(),
  quality: z.coerce.number().int().min(1).max(100).optional(),
  brightness: z.coerce.number().min(-1).max(1).optional(),
  saturation: z.coerce.number().min(-1).max(1).optional(),
  hue: z.coerce.number().min(0).max(360).optional(),
  lightness: z.coerce.number().min(-1).max(1).optional(),
  info: z.boolean().default(false),
  withoutEnlargement: z.boolean().default(false),
  version: z.boolean().default(false),
  help: z.boolean().default(false),
});

/** Parsed CLI options after validation. */
export type CliOptions = z.infer<typeof CliOptionsSchema>;

/** Print help text and exit. */
export function printHelp(): void {
  console.log(USAGE);
}

/** Print version and exit. */
export function printVersion(): void {
  console.log(pkg.version);
}

function formatValidationError(message: string): string {
  return `${style.red(CLI_NAME + ": error")}\n  ${style.yellow(message)}\n\n  For usage information, run: ${style.cyan(CLI_HELP_CMD)}`;
}

function formatFileNotFound(file: string): string {
  return `${style.red(CLI_NAME + ": error")}\n  ${style.yellow("file not found")}: ${style.bold(file)}\n\n  For usage information, run: ${style.cyan(CLI_HELP_CMD)}`;
}

/** Format error message when no input source is provided. */
export function formatNoInput(): string {
  return `${style.red(CLI_NAME + ": error")}\n  ${style.yellow("no input provided. Pass a file or pipe image data via stdin.")}\n\n  For usage information, run: ${style.cyan(CLI_HELP_CMD)}`;
}

/** Parse CLI arguments into structured options with zod validation. */
export function parseArgs(argv: string[]): CliOptions {
  const options: Record<string, unknown> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    switch (arg) {
      case "--out":
      case "-o": {
        i++;
        options.outFile = argv[i];
        break;
      }
      case "--resize": {
        i++;
        options.resize = argv[i];
        break;
      }
      case "--fit": {
        i++;
        options.fit = argv[i];
        break;
      }
      case "--filter": {
        i++;
        options.filter = argv[i];
        break;
      }
      case "--rotate": {
        i++;
        options.rotate = argv[i];
        break;
      }
      case "--flip":
        options.flip = true;
        break;
      case "--flop":
        options.flop = true;
        break;
      case "--format": {
        i++;
        options.format = argv[i];
        break;
      }
      case "--quality": {
        i++;
        options.quality = argv[i];
        break;
      }
      case "--brightness": {
        i++;
        options.brightness = argv[i];
        break;
      }
      case "--saturation": {
        i++;
        options.saturation = argv[i];
        break;
      }
      case "--hue": {
        i++;
        options.hue = argv[i];
        break;
      }
      case "--lightness": {
        i++;
        options.lightness = argv[i];
        break;
      }
      case "--info":
        options.info = true;
        break;
      case "--without-enlargement":
        options.withoutEnlargement = true;
        break;
      case "--version":
      case "-v":
        options.version = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        if (!arg.startsWith("-")) {
          options.file = arg;
        } else {
          throw new Error(formatValidationError(`Unknown flag: ${arg}`));
        }
        break;
    }
  }

  const result = CliOptionsSchema.safeParse(options);
  if (!result.success) {
    const first = result.error.issues[0]!;
    const message = first ? `${first.path.join(".")}: ${first.message}` : "Invalid arguments";
    throw new Error(formatValidationError(message));
  }

  return result.data;
}

/** Read image data from a file or stdin. */
export async function readInput(file?: string): Promise<Uint8Array> {
  if (file) {
    const fileRef = Bun.file(file);
    if (!(await fileRef.exists())) {
      throw new Error(formatFileNotFound(file));
    }
    return await fileRef.bytes();
  }

  if (process.stdin.isTTY) {
    return new Uint8Array();
  }

  return await Bun.stdin.bytes();
}

/**
 * Infer the output format from a file extension. Returns undefined if the extension is not
 * recognized.
 */
export function inferFormatFromExtension(file: string): OutputFormat | undefined {
  const ext = file.toLowerCase().split(".").pop();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "jpeg" as OutputFormat;
    case "png":
      return "png" as OutputFormat;
    case "webp":
      return "webp" as OutputFormat;
    case "heic":
      return "heic" as OutputFormat;
    case "avif":
      return "avif" as OutputFormat;
    default:
      return undefined;
  }
}
