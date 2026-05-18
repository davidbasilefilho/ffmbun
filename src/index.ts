#!/usr/bin/env bun
import {
  getImageInfo,
  processImage,
  processImagePlaceholder,
  processImageToBase64,
  processImageToDataUrl,
  processClipboardImage as processClipboard,
  hasClipboardImage,
  saveImage,
} from "./process";
import type { ProcessOptions } from "./process";
import { style } from "./style";
import {
  CLI_NAME,
  formatNoInput,
  parseArgs,
  printHelp,
  printVersion,
  readInput,
  inferFormatFromExtension,
} from "./utils";
import type { CliOptions, OutputFormat } from "./utils";

function isUint8ArrayEmpty(arr: Uint8Array): boolean {
  return arr.length === 0;
}

/**
 * Determine the output format from CLI options or the output file extension. Falls back to "png" if
 * neither is specified.
 */
function resolveOutputFormat(opts: CliOptions): OutputFormat {
  if (opts.format) return opts.format;
  if (opts.outFile) {
    const inferred = inferFormatFromExtension(opts.outFile);
    if (inferred) return inferred;
  }
  // Default to PNG if no format or output path specified
  return "png" as OutputFormat;
}

/** Build ProcessOptions from parsed CLI arguments. */
function buildProcessOptions(opts: CliOptions): ProcessOptions {
  const encode =
    opts.format || opts.outFile
      ? {
          format: resolveOutputFormat(opts),
          quality: opts.quality,
          progressive: opts.progressive || undefined,
          lossless: opts.lossless || undefined,
          palette: opts.palette || undefined,
          colors: opts.colors,
          compressionLevel: opts.compressionLevel,
          dither: opts.dither || undefined,
        }
      : undefined;

  const processOpts: ProcessOptions = {
    encode,
    backend: opts.backend,
  };

  if (opts.resize) {
    const parts = opts.resize.split("x");
    if (parts[0]) {
      processOpts.resize = {
        width: Number(parts[0]),
        height: parts[1] ? Number(parts[1]) : undefined,
        fit: opts.fit,
        withoutEnlargement: opts.withoutEnlargement,
        filter: opts.filter,
      };
    }
  }

  if (opts.rotate !== undefined) {
    processOpts.rotate = opts.rotate;
  }

  if (opts.flip) {
    processOpts.flip = true;
  }

  if (opts.flop) {
    processOpts.flop = true;
  }

  if (
    opts.brightness !== undefined ||
    opts.saturation !== undefined ||
    opts.hue !== undefined ||
    opts.lightness !== undefined
  ) {
    processOpts.modulate = {
      brightness: opts.brightness,
      saturation: opts.saturation,
      hue: opts.hue,
      lightness: opts.lightness,
    };
  }

  return processOpts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (opts.version) {
    printVersion();
    process.exit(0);
  }

  // --info mode: show metadata and exit
  if (opts.info) {
    if (!opts.file) {
      console.error(formatNoInput());
      process.exit(1);
    }
    const info = await getImageInfo(opts.file);
    console.log(`${style.bold("Width:")}  ${info.width}`);
    console.log(`${style.bold("Height:")} ${info.height}`);
    console.log(`${style.bold("Format:")} ${info.format}`);
    process.exit(0);
  }

  // Clipboard source
  if (opts.clipboard) {
    if (!hasClipboardImage()) {
      console.error(style.red("No image found in clipboard"));
      process.exit(1);
    }
    const processOpts = buildProcessOptions(opts);
    const bytes = await processClipboard(processOpts);
    if (opts.outFile) {
      const written = await saveImage(bytes, opts.outFile);
      console.error(
        style.green(`Written to ${style.bold(opts.outFile)} (${(written / 1024).toFixed(1)} KB)`),
      );
    } else {
      process.stdout.write(bytes);
    }
    return;
  }

  const imageData = await readInput(opts.file);

  if (isUint8ArrayEmpty(imageData)) {
    printHelp();
    process.exit(0);
  }

  const processOpts = buildProcessOptions(opts);

  // Terminal: placeholder data URL
  if (opts.placeholder) {
    const placeholder = await processImagePlaceholder(imageData, processOpts);
    console.log(placeholder);
    process.exit(0);
  }

  // Terminal: base64
  if (opts.base64) {
    const b64 = await processImageToBase64(imageData, processOpts);
    console.log(b64);
    process.exit(0);
  }

  // Terminal: data URL
  if (opts.dataurl) {
    const du = await processImageToDataUrl(imageData, processOpts);
    console.log(du);
    process.exit(0);
  }

  // Default terminal: bytes
  const bytes = await processImage(imageData, processOpts);

  if (opts.outFile) {
    const written = await saveImage(bytes, opts.outFile);
    console.error(
      style.green(`Written to ${style.bold(opts.outFile)} (${(written / 1024).toFixed(1)} KB)`),
    );
  } else {
    process.stdout.write(bytes);
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error && err.message.startsWith(style.red(CLI_NAME + ": error"))) {
    console.error(err.message);
  } else {
    console.error(style.red("Error:"), err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
