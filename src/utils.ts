import { z } from "zod";

import pkg from "../package.json" with { type: "json" };
import { style } from "./style";

export const CLI_NAME = "ffmbun";
const CLI_HELP_CMD = `${CLI_NAME} --help`;

const BANNER = `${style.bold(style.cyan(CLI_NAME))} ${style.dim("\u2014")} ${style.italic("An alternative to ffmpeg using Bun\u2019s image capabilities")}`;

const USAGE = `
${BANNER}

${style.bold("USAGE")}
  ${style.cyan(CLI_NAME)} ${style.dim("[options]")} ${style.yellow("<input>")} ${style.dim("[output]")}

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

${style.bold("FFMPEG-COMPATIBLE FLAGS")}
  ${style.cyan("-i")} ${style.yellow("<file>")}           ${style.dim("Input file path")}
  ${style.cyan("-s")} ${style.yellow("<WxH>")}             ${style.dim("Resize (same as --resize)")}
  ${style.cyan("-vf")} ${style.yellow("<filter_graph>")}    ${style.dim("Filter graph: scale, hflip, vflip, transpose, hue, eq")}
  ${style.cyan("-q:v")} ${style.yellow("<n>")}              ${style.dim("Quality (same as --quality)")}
  ${style.cyan("-c:v")}, ${style.cyan("--codec:v")}, ${style.cyan("--c:v")} ${style.yellow("<codec>")} ${style.dim("Select codec (maps to format)")}
  ${style.cyan("-f")} ${style.yellow("<fmt>")}              ${style.dim("Force output format")}
   ${style.cyan("-y")}                 ${style.dim("Overwrite output without asking")}

${style.bold("OUTPUT TERMINALS")}
   ${style.cyan("--placeholder")}       ${style.dim("Output a low-res placeholder data URL")}
   ${style.cyan("--base64")}            ${style.dim("Output base64-encoded string")}
   ${style.cyan("--dataurl")}           ${style.dim("Output data URL")}
   ${style.cyan("--clipboard")}         ${style.dim("Read image from system clipboard")}

${style.bold("ADVANCED ENCODE OPTIONS")}
   ${style.cyan("--progressive")}       ${style.dim("Progressive JPEG")}
   ${style.cyan("--lossless")}          ${style.dim("Lossless WebP")}
   ${style.cyan("--palette")}           ${style.dim("Indexed PNG palette")}
   ${style.cyan("--colors")} ${style.yellow("<n>")}          ${style.dim("Palette colors 2-256")}
   ${style.cyan("--compression-level")} ${style.yellow("<n>")} ${style.dim("PNG compression 0-9")}
   ${style.cyan("--dither")}            ${style.dim("Enable PNG palette dithering")}
   ${style.cyan("--backend")} ${style.yellow("<mode>")}       ${style.dim("Backend: system or bun")}

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

  ${style.dim("# ffmpeg-style: scale and flop")}
  ${style.cyan(CLI_NAME)} ${style.cyan("-i")} ${style.yellow("photo.jpg")} ${style.cyan("-vf")} ${style.yellow("scale=800:-1,hflip")} ${style.yellow("output.jpg")}

   ${style.dim("# ffmpeg-style: codec selection")}
   ${style.cyan(CLI_NAME)} ${style.cyan("-i")} ${style.yellow("photo.jpg")} ${style.cyan("-c:v")} ${style.yellow("libwebp")} ${style.yellow("photo.webp")}

   ${style.dim("# ffmpeg-style: quality and transpose")}
   ${style.cyan(CLI_NAME)} ${style.cyan("-i")} ${style.yellow("photo.jpg")} ${style.cyan("-vf")} ${style.yellow("transpose=1")} ${style.cyan("-q:v")} ${style.yellow("90")} ${style.yellow("output.jpg")}

   ${style.dim("# Generate placeholder data URL")}
   ${style.cyan(CLI_NAME)} ${style.yellow("photo.jpg")} ${style.cyan("--resize")} ${style.yellow("100")} ${style.cyan("--placeholder")}

   ${style.dim("# Lossless WebP from clipboard")}
   ${style.cyan(CLI_NAME)} ${style.cyan("--clipboard")} ${style.cyan("--lossless")} ${style.cyan("-o")} ${style.yellow("clipboard.webp")}

   ${style.dim("# Indexed PNG with 32 colors")}
   ${style.cyan(CLI_NAME)} ${style.yellow("screenshot.png")} ${style.cyan("--palette")} ${style.cyan("--colors")} ${style.yellow("32")} ${style.cyan("-o")} ${style.yellow("optimized.png")}
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

/** Maps ffmpeg codec names to output formats. */
const CODEC_TO_FORMAT: Record<string, string> = {
  libwebp: "webp",
  webp: "webp",
  libwebp_anim: "webp",
  png: "png",
  pngpipe: "png",
  mjpeg: "jpeg",
  jpg: "jpeg",
  jpeg: "jpeg",
  libjpeg: "jpeg",
  "libjpeg-turbo": "jpeg",
  libx265: "heic",
  hevc: "heic",
  heic: "heic",
  libhevc: "heic",
  av1: "avif",
  "libaom-av1": "avif",
  "svt-av1": "avif",
  avif: "avif",
  libavif: "avif",
};

/** Maps ffmpeg format names to output formats. Undefined = unsupported. */
const FORMAT_NAME_MAP: Record<string, string | undefined> = {
  mjpeg: "jpeg",
  jpg: "jpeg",
  jpeg: "jpeg",
  image2: undefined,
  png: "png",
  image2pipe: "png",
  webp: "webp",
  heic: "heic",
  avif: "avif",
  rawvideo: undefined,
  bmp: undefined,
};

/** Internal representation of a single parsed -vf filter. */
export interface VfFilter {
  type: string;
  params: Record<string, string>;
}

export const VfFilterSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.string()),
});

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
  overwrite: z.boolean().default(false),
  vfFilters: z.array(VfFilterSchema).default([]),
  // New feature flags
  placeholder: z.boolean().default(false),
  base64: z.boolean().default(false),
  dataurl: z.boolean().default(false),
  clipboard: z.boolean().default(false),
  backend: z.enum(["system", "bun"]).optional(),
  progressive: z.boolean().default(false),
  lossless: z.boolean().default(false),
  palette: z.boolean().default(false),
  colors: z.coerce.number().int().min(2).max(256).optional(),
  compressionLevel: z.coerce.number().int().min(0).max(9).optional(),
  dither: z.boolean().default(false),
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

/**
 * Parse an ffmpeg-style video filter graph string and map filters to options.
 *
 * Supports: scale, hflip, vflip, transpose, hue, eq.
 */
function parseVfFilterGraph(graph: string, options: Record<string, unknown>): void {
  const filters: VfFilter[] = [];
  const parts = graph.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIdx = trimmed.indexOf("=");
    let filterType: string;
    let paramsStr: string;

    if (eqIdx === -1) {
      filterType = trimmed;
      paramsStr = "";
    } else {
      filterType = trimmed.slice(0, eqIdx);
      paramsStr = trimmed.slice(eqIdx + 1);
    }

    const params: Record<string, string> = {};
    if (paramsStr) {
      const pairs = paramsStr.split(":");
      let positionalIndex = 0;
      for (const pair of pairs) {
        const innerEq = pair.indexOf("=");
        if (innerEq !== -1) {
          const key = pair.slice(0, innerEq).trim();
          const val = pair.slice(innerEq + 1).trim();
          params[key] = val;
        } else {
          params[`_${positionalIndex++}`] = pair.trim();
        }
      }
    }

    filters.push({ type: filterType, params });
  }

  // Map parsed filters to existing option fields
  for (const filter of filters) {
    switch (filter.type) {
      case "scale": {
        const w = filter.params["w"] || filter.params["width"] || filter.params["_0"];
        const h = filter.params["h"] || filter.params["height"] || filter.params["_1"];
        const dimParts: string[] = [];
        if (w && w !== "-1") dimParts.push(w);
        if (h && h !== "-1") dimParts.push(h);
        if (dimParts.length > 0) {
          options.resize = dimParts.join("x");
        }
        break;
      }
      case "hflip":
        options.flop = true;
        break;
      case "vflip":
        options.flip = true;
        break;
      case "transpose": {
        const dirVal = filter.params["dir"] ?? filter.params["_0"];
        const dir = dirVal ? parseInt(dirVal, 10) : NaN;
        if (dir === 0 || dir === 2) {
          options.rotate = 270;
        }
        if (dir === 1 || dir === 3) {
          options.rotate = 90;
        }
        if (dir === 2 || dir === 3) {
          options.flip = true;
        }
        break;
      }
      case "hue": {
        const hVal = filter.params["H"];
        const sVal = filter.params["s"];
        if (hVal !== undefined) {
          options.hue = parseFloat(hVal);
        }
        if (sVal !== undefined) {
          options.saturation = parseFloat(sVal);
        }
        break;
      }
      case "eq": {
        const brightVal = filter.params["brightness"];
        const satVal = filter.params["saturation"];
        if (brightVal !== undefined) {
          options.brightness = parseFloat(brightVal);
        }
        if (satVal !== undefined) {
          options.saturation = parseFloat(satVal);
        }
        break;
      }
    }
  }

  // Store raw parsed filters for internal use
  options.vfFilters = filters;
}

/** Parse CLI arguments into structured options with zod validation. */
export function parseArgs(argv: string[]): CliOptions {
  const options: Record<string, unknown> = {};
  let iUsed = false;
  let firstNonFlag: string | undefined;
  let secondNonFlag: string | undefined;

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
      // ffmpeg-compatible flags
      case "-i": {
        i++;
        options.file = argv[i];
        iUsed = true;
        break;
      }
      case "-s": {
        i++;
        options.resize = argv[i];
        break;
      }
      case "-vf": {
        i++;
        parseVfFilterGraph(argv[i]!, options);
        break;
      }
      case "-q:v": {
        i++;
        options.quality = argv[i];
        break;
      }
      case "-c:v":
      case "--codec:v":
      case "--c:v": {
        i++;
        const codec = argv[i]!;
        const fmt = CODEC_TO_FORMAT[codec.toLowerCase()];
        if (fmt) {
          options.format = fmt;
        }
        break;
      }
      case "-f": {
        i++;
        const raw = argv[i]!;
        const fmt = FORMAT_NAME_MAP[raw.toLowerCase()];
        if (fmt !== undefined && !("format" in options)) {
          options.format = fmt;
        }
        break;
      }
      case "-y":
        options.overwrite = true;
        break;
      // New feature flags
      case "--placeholder":
        options.placeholder = true;
        break;
      case "--base64":
        options.base64 = true;
        break;
      case "--dataurl":
        options.dataurl = true;
        break;
      case "--clipboard":
        options.clipboard = true;
        break;
      case "--backend": {
        i++;
        options.backend = argv[i];
        break;
      }
      case "--progressive":
        options.progressive = true;
        break;
      case "--lossless":
        options.lossless = true;
        break;
      case "--palette":
        options.palette = true;
        break;
      case "--colors": {
        i++;
        options.colors = argv[i];
        break;
      }
      case "--compression-level": {
        i++;
        options.compressionLevel = argv[i];
        break;
      }
      case "--dither":
        options.dither = true;
        break;
      default:
        if (!arg.startsWith("-")) {
          if (firstNonFlag === undefined) {
            firstNonFlag = arg;
          } else if (secondNonFlag === undefined) {
            secondNonFlag = arg;
          }
        } else {
          throw new Error(formatValidationError(`Unknown flag: ${arg}`));
        }
        break;
    }
  }

  // Positional arg resolution
  if (!iUsed && firstNonFlag !== undefined) {
    options.file = firstNonFlag;
  }

  if (iUsed && firstNonFlag !== undefined && !("outFile" in options)) {
    // -i was used, so first positional is the output file
    options.outFile = firstNonFlag;
  }

  if (secondNonFlag !== undefined && !("outFile" in options)) {
    options.outFile = secondNonFlag;
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
