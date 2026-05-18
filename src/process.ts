import type { FitMode, OutputFormat, ResampleFilter } from "./utils";

/** Options for resizing an image */
export interface ResizeOptions {
  width: number;
  height?: number;
  fit?: FitMode;
  withoutEnlargement?: boolean;
  filter?: ResampleFilter;
}

/** Options for modulating brightness, saturation, hue, and lightness */
export interface ModulateOptions {
  brightness?: number;
  saturation?: number;
  hue?: number;
  lightness?: number;
}

/** Options for encoding the output image */
export interface EncodeOptions {
  format: OutputFormat;
  quality?: number;
  /** Enable progressive scan (JPEG only) */
  progressive?: boolean;
  /** Encode as lossless (WebP only) */
  lossless?: boolean;
  /** Use indexed color palette (PNG only) */
  palette?: boolean;
  /** Number of colors for indexed palette, 2-256 (PNG only) */
  colors?: number;
  /** Enable dithering for indexed palette (PNG only) */
  dither?: boolean;
  /** PNG compression level, 0-9 (PNG only) */
  compressionLevel?: number;
}

/** Complete set of processing options for the image pipeline */
export interface ProcessOptions {
  resize?: ResizeOptions;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  modulate?: ModulateOptions;
  encode?: EncodeOptions;
  /** Auto-orient based on EXIF metadata (default: true) */
  autoOrient?: boolean;
  /** Decompression bomb limit in pixels */
  maxPixels?: number;
  /** Image processing backend */
  backend?: "system" | "bun";
}

/** Metadata extracted from an image */
export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

/**
 * Parse a resize string like "800" or "800x600" into ResizeOptions.
 *
 * @param value - The resize string to parse (e.g. "800", "800x600").
 * @returns Parsed ResizeOptions with optional height.
 */
function parseResizeValue(value: string): ResizeOptions {
  const parts = value.split("x");
  const width = Number(parts[0]!);
  const height = parts[1] ? Number(parts[1]) : undefined;
  return { width, height };
}

/** Map CLI filter names to Bun.Image filter names. "bilinear" maps to "linear" in Bun.Image. */
function mapFilterName(filter: ResampleFilter): string {
  if (filter === "bilinear") return "linear";
  return filter;
}

/** Internal constructor options for Bun.Image */
interface LoadImageOptions {
  autoOrient: boolean;
  maxPixels?: number;
}

/**
 * Load an image from bytes or a file path.
 *
 * @param input - The image source: a file path string, a Uint8Array, or a Buffer.
 * @param opts - Constructor options (autoOrient, maxPixels).
 * @returns A Bun.Image instance ready for processing.
 */
function loadImage(
  input: string | Uint8Array | Buffer,
  opts: LoadImageOptions = { autoOrient: true },
): Bun.Image {
  const constructOpts: Record<string, unknown> = {};
  constructOpts.autoOrient = opts.autoOrient;
  if (opts.maxPixels !== undefined) {
    constructOpts.maxPixels = opts.maxPixels;
  }
  return new Bun.Image(input as any, constructOpts);
}

/**
 * Apply all requested transforms to a Bun.Image in sequence.
 *
 * The operations are applied in a consistent order: 1. Resize 2. Rotate 3. Flip 4. Flop 5. Modulate
 *
 * @param image - The source image to transform.
 * @param opts - The processing options specifying which transforms to apply.
 * @returns The transformed Bun.Image.
 */
function applyTransforms(image: Bun.Image, opts: ProcessOptions): Bun.Image {
  let result = image;

  if (opts.resize) {
    const { width, height, fit, withoutEnlargement, filter } = opts.resize;
    result = result.resize(width, height, {
      fit,
      withoutEnlargement,
      filter: filter ? (mapFilterName(filter) as any) : undefined,
    });
  }

  if (opts.rotate !== undefined) {
    result = result.rotate(opts.rotate);
  }

  if (opts.flip) {
    result = result.flip();
  }

  if (opts.flop) {
    result = result.flop();
  }

  if (opts.modulate) {
    const { brightness, saturation, hue, lightness } = opts.modulate;
    result = result.modulate({
      ...(brightness !== undefined && { brightness }),
      ...(saturation !== undefined && { saturation }),
      ...(hue !== undefined && { hue }),
      ...(lightness !== undefined && { lightness }),
    });
  }

  return result;
}

/**
 * Encode a Bun.Image into the specified output format.
 *
 * @param image - The image to encode.
 * @param opts - Encoding options (format, quality, and advanced codec options).
 * @returns A Bun.Image in the target format.
 */
function encodeImage(image: Bun.Image, opts: EncodeOptions): Bun.Image {
  const { format, quality, progressive, lossless, palette, colors, dither, compressionLevel } =
    opts;

  switch (format) {
    case "jpeg":
      return image.jpeg({ quality, progressive });
    case "png":
      return image.png({
        ...(compressionLevel !== undefined
          ? { compressionLevel }
          : quality !== undefined
            ? { compressionLevel: Math.round(quality / 10) }
            : {}),
        ...(palette !== undefined && { palette }),
        ...(colors !== undefined && { colors }),
        ...(dither !== undefined && { dither }),
      });
    case "webp":
      return image.webp({ quality, lossless });
    case "heic":
      return image.heic({ quality });
    case "avif":
      return image.avif({ quality });
  }
}

/**
 * Internal pipeline: load → applyTransforms → encode.
 *
 * Sets the image backend if specified, then loads the image with the configured constructor
 * options, applies all transforms, and encodes to the target format.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded Bun.Image ready for terminal extraction.
 */
async function runPipeline(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<Bun.Image> {
  if (opts.backend) {
    Bun.Image.backend = opts.backend;
  }

  const image = loadImage(input, {
    autoOrient: opts.autoOrient ?? true,
    maxPixels: opts.maxPixels,
  });

  const transformed = applyTransforms(image, opts);

  if (!opts.encode) {
    throw new Error("Encode options are required. Did you mean to use processImagePlaceholder?");
  }

  return encodeImage(transformed, opts.encode);
}

/**
 * Process an image through the full pipeline: load, transform, encode.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image bytes.
 */
export async function processImage(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<Uint8Array> {
  return await (await runPipeline(input, opts)).bytes();
}

/**
 * Process an image and return a Base64-encoded string.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image as a Base64 string.
 */
export async function processImageToBase64(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<string> {
  return (await runPipeline(input, opts)).toBase64();
}

/**
 * Process an image and return a data URL string.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image as a data URL.
 */
export async function processImageToDataUrl(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<string> {
  return (await runPipeline(input, opts)).dataurl();
}

/**
 * Process an image and return a Node.js Buffer.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image as a Buffer.
 */
export async function processImageToBuffer(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<Buffer> {
  return (await runPipeline(input, opts)).buffer();
}

/**
 * Process an image and return a Blob.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image as a Blob.
 */
export async function processImageToBlob(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions,
): Promise<Blob> {
  return (await runPipeline(input, opts)).blob();
}

/**
 * Generate a low-resolution placeholder data URL from an image.
 *
 * Loads the image, applies transforms, and calls `.placeholder()` to produce a small embedded
 * preview. Does not require encode options.
 *
 * @param input - File path or raw bytes of the source image.
 * @param opts - Processing options specifying transforms (encode is not required).
 * @returns A placeholder data URL string.
 */
export async function processImagePlaceholder(
  input: string | Uint8Array | Buffer,
  opts: ProcessOptions = {},
): Promise<string> {
  if (opts.backend) {
    Bun.Image.backend = opts.backend;
  }

  const image = loadImage(input, {
    autoOrient: opts.autoOrient ?? true,
    maxPixels: opts.maxPixels,
  });

  const transformed = applyTransforms(image, opts);

  return transformed.placeholder();
}

/**
 * Check if an image is currently available on the system clipboard.
 *
 * @returns `true` if a clipboard image exists, `false` otherwise.
 */
export function hasClipboardImage(): boolean {
  try {
    return Bun.Image.fromClipboard() !== null;
  } catch {
    return false;
  }
}

/**
 * Process an image from the system clipboard through the full pipeline.
 *
 * @param opts - Processing options specifying transforms and output format.
 * @returns The encoded image bytes.
 */
export async function processClipboardImage(opts: ProcessOptions): Promise<Uint8Array> {
  const clipboardImage = Bun.Image.fromClipboard();

  if (!clipboardImage) {
    throw new Error("No image found in clipboard");
  }

  if (opts.backend) {
    Bun.Image.backend = opts.backend;
  }

  const transformed = applyTransforms(clipboardImage, opts);

  if (!opts.encode) {
    throw new Error("Encode options are required for processClipboardImage");
  }

  const encoded = encodeImage(transformed, opts.encode);

  return await encoded.bytes();
}

/**
 * Get metadata (width, height, format) from an image file.
 *
 * @param input - File path of the image.
 * @returns Image metadata including dimensions and format.
 */
export async function getImageInfo(input: string): Promise<ImageInfo> {
  const image = loadImage(input);
  const meta = await image.metadata();
  return {
    width: image.width,
    height: image.height,
    format: meta?.format ?? "unknown",
  };
}

/**
 * Save bytes to a file.
 *
 * @param data - The image bytes to write.
 * @param path - The destination file path.
 * @returns The number of bytes written.
 */
export async function saveImage(data: Uint8Array, path: string): Promise<number> {
  return await Bun.write(path, data);
}

export { parseResizeValue };
