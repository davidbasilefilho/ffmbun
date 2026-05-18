# ffmbun

**An alternative to ffmpeg using Bun's image capabilities** — powered by Bun's native [`Bun.Image`](https://bun.sh/docs/runtime/image) engine.

Resize, rotate, flip, convert, adjust, generate placeholders, and output in multiple formats — all in one fast CLI tool with an **ffmpeg-compatible CLI interface**.

## Install

```bash
bun install -g ffmbun
```

## Usage

### ffmpeg-style (recommended)

```bash
# Convert to WebP (ffmpeg-style)
ffmbun -i photo.jpg -c:v libwebp photo.webp

# Scale and horizontal flop
ffmbun -i photo.jpg -vf "scale=800:-1,hflip" output.jpg

# Rotate 90° CW with quality
ffmbun -i photo.jpg -vf "transpose=1" -q:v 90 output.jpg

# Use codec selection
ffmbun -i photo.jpg -c:v mjpeg -q:v 85 output.jpg
```

### Original-style (also supported)

```bash
# Convert an image to WebP
ffmbun photo.jpg --format webp -o photo.webp

# Resize to 800px width (maintain aspect ratio)
ffmbun photo.jpg --resize 800 -o thumb.jpg

# Resize to exact dimensions
ffmbun photo.jpg --resize 800x600 --fit inside -o photo.jpg

# Rotate and flip
ffmbun photo.jpg --rotate 90 --flip -o rotated.jpg

# Show image metadata
ffmbun photo.jpg --info

# Adjust brightness and saturation
ffmbun photo.jpg --brightness 0.2 --saturation 0.5 -o adjusted.jpg

# Pipe from stdin
cat photo.jpg | ffmbun --format png -o out.png

# Generate a low-res placeholder data URL for HTML
ffmbun hero.jpg --resize 100 --placeholder

# Process from clipboard
ffmbun --clipboard --format webp -o clipboard.webp

# Lossless WebP
ffmbun photo.jpg --lossless -o photo.webp

# Indexed PNG (3-5× smaller for screenshots)
ffmbun screenshot.png --palette --colors 64 -o optimized.png
```

## Options

### Image options

| Flag                    | Description                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `--out`, `-o <file>`    | Write output to file instead of stdout                                                |
| `--resize <WxH>`        | Resize image (e.g. `"800"` or `"800x600"`)                                            |
| `--fit <mode>`          | Fit mode: `fill`, `inside` (default: `fill`)                                          |
| `--filter <name>`       | Resampling filter: `lanczos3`, `lanczos2`, `mitchell`, `cubic`, `bilinear`, `nearest` |
| `--rotate <deg>`        | Rotate (90, 180, 270)                                                                 |
| `--flip`                | Flip vertically                                                                       |
| `--flop`                | Flop horizontally                                                                     |
| `--format <fmt>`        | Output format: `jpeg`, `png`, `webp`, `heic`, `avif`                                  |
| `--quality <n>`         | Quality for lossy formats (1–100)                                                     |
| `--brightness <n>`      | Adjust brightness (−1 to 1)                                                           |
| `--saturation <n>`      | Adjust saturation (−1 to 1)                                                           |
| `--hue <n>`             | Adjust hue (0–360)                                                                    |
| `--lightness <n>`       | Adjust lightness (−1 to 1)                                                            |
| `--info`                | Show image metadata and exit                                                          |
| `--without-enlargement` | Never upscale when resizing                                                           |
| `--version`, `-v`       | Show version                                                                          |
| `--help`, `-h`          | Show this help                                                                        |

### ffmpeg-compatible flags

| Flag                           | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `-i <file>`                    | Input file path                                 |
| `-s <WxH>`                     | Resize (same as `--resize`)                     |
| `-vf <filter_graph>`           | Filter graph: `scale`, `hflip`, `vflip`, `transpose`, `hue`, `eq` |
| `-q:v <n>`                     | Quality (same as `--quality`)                    |
| `-c:v`, `--codec:v`, `--c:v <codec>` | Codec selection (`libwebp`, `mjpeg`, `png`, etc.) |
| `-f <fmt>`                     | Force output format                             |
| `-y`                           | Overwrite output without asking                 |

### Output terminals

| Flag              | Description                                     |
| ----------------- | ----------------------------------------------- |
| `--placeholder`   | Output a low-res placeholder data URL (ThumbHash) |
| `--base64`        | Output base64-encoded string                     |
| `--dataurl`       | Output data URL                                 |
| `--clipboard`     | Read image from system clipboard instead of file |

### Advanced encode options

| Flag                   | Description                       |
| ---------------------- | --------------------------------- |
| `--progressive`        | Progressive JPEG                  |
| `--lossless`           | Lossless WebP                     |
| `--palette`            | Indexed PNG palette               |
| `--colors <n>`         | Palette colors (2-256)            |
| `--compression-level <n>` | PNG compression level (0-9)     |
| `--dither`             | Enable PNG palette dithering      |
| `--backend <mode>`     | Backend: `system` or `bun`        |

## Features

- **Resize** — width-only (maintains aspect ratio), exact dimensions, fit modes (fill/inside), multiple resampling filters
- **Rotate** — 90°, 180°, 270°
- **Flip/Flop** — vertical and horizontal mirroring
- **Modulate** — brightness, saturation, hue, and lightness adjustments
- **Format conversion** — JPEG, PNG, WebP, HEIC, AVIF
- **Metadata** — view image dimensions and format with `--info`
- **Placeholder (ThumbHash)** — generate low-res data URLs for HTML previews (~400-700 bytes)
- **Base64 / data URL** — output as base64 string or data URL
- **Clipboard I/O** — read images from system clipboard (macOS/Windows)
- **Progressive JPEG** — coarse-to-fine rendering for slow connections
- **Lossless WebP** — higher quality for lossless workflows
- **Indexed PNG** — palette-based PNG (3-5× smaller for screenshots/UI assets)
- **Backend toggle** — switch between system (Accelerate/ImageIO) and bun (portable Highway SIMD)
- **Decompression bomb protection** — set `maxPixels` limit
- **ffmpeg-compatible CLI** — `-i`, `-vf`, `-c:v`, `-q:v`, `-f`, `-s`, `-y`, positional output
- **Stdin support** — pipe image data directly into the tool
- **Fast** — built on Bun's native `Bun.Image` with zero overhead, libjpeg-turbo, spng, libwebp
- **Auto-orient** — EXIF orientation is automatically applied

## Development

```bash
# Install dependencies
bun install

# Run in development
bun start -- photo.jpg --info

# Lint and format
bun run check

# Build for distribution (JavaScript)
bun run build

# Run tests
bun test
```

## Publishing

```bash
bun run build
npm publish
```

The `prepublishOnly` hook runs the build automatically.

## License

Apache 2.0
