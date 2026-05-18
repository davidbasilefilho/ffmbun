# ffmbun

**An alternative to ffmpeg using Bun's image capabilities** — powered by Bun's native [`Bun.Image`](https://bun.sh/docs/runtime/image) engine.

Resize, rotate, flip, convert, and adjust images — all in one fast CLI tool.

## Install

```bash
bun install -g ffmbun
```

## Usage

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
```

## Options

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

## Features

- **Resize** — width-only (maintains aspect ratio), exact dimensions, fit modes (fill/inside), multiple resampling filters
- **Rotate** — 90°, 180°, 270°
- **Flip/Flop** — vertical and horizontal mirroring
- **Modulate** — brightness, saturation, hue, and lightness adjustments
- **Format conversion** — JPEG, PNG, WebP, HEIC, AVIF
- **Metadata** — view image dimensions and format with `--info`
- **Stdin support** — pipe image data directly into the tool
- **Fast** — built on Bun's native `Bun.Image` with zero overhead
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
