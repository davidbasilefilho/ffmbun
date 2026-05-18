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
}

/** Complete set of processing options for the image pipeline */
export interface ProcessOptions {
  resize?: ResizeOptions;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  modulate?: ModulateOptions;
  encode: EncodeOptions;
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

/**
 * Load an image from bytes or a file path.
 *
 * @param input - The image source: a file path string, a Uint8Array, or a Buffer.
 * @returns A Bun.Image instance ready for processing.
 */
function loadImage(input: string | Uint8Array | Buffer): Bun.Image {
  return new Bun.Image(input as any, { autoOrient: true });
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
 * @param opts - Encoding options (format and quality).
 * @returns A Bun.Image in the target format.
 */
function encodeImage(image: Bun.Image, opts: EncodeOptions): Bun.Image {
  const { format, quality } = opts;

  switch (format) {
    case "jpeg":
      return image.jpeg({ quality });
    case "png":
      return image.png({
        compressionLevel: quality !== undefined ? Math.round(quality / 10) : undefined,
      });
    case "webp":
      return image.webp({ quality });
    case "heic":
      return image.heic({ quality });
    case "avif":
      return image.avif({ quality });
  }
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
  const image = loadImage(input);
  const transformed = applyTransforms(image, opts);
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
