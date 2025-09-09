# Script to convert SVG icons to PNG format for a browser extension (especially Chromium-based)
# You can use this script if you have Python with the right dependencies
# Otherwise, you can use an online tool to convert SVG to PNG

try:
    import cairosvg
    import io
except ImportError:
    print("To convert SVG to PNG, install the dependencies:")
    print("pip install Pillow cairosvg")
    print("... or use an online tool to convert SVG files to PNG")
    print("Required sizes are: 16x16, 48x48, and 128x128 pixels")

def main() -> None:
    def convert_svg_to_png(svg_path: str, png_path: str, size: int) -> None:
        png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
        # Save the PNG
        with open(png_path, 'wb') as f:
            f.write(png_data)
        print(f"Converted: {svg_path} -> {png_path}")

    convert_svg_to_png("icons/icon16.svg", "icons/icon16.png", 16)
    convert_svg_to_png("icons/icon48.svg", "icons/icon48.png", 48)
    convert_svg_to_png("icons/icon128.svg", "icons/icon128.png", 128)

    print("All icons have been successfully converted!")

if __name__ == "__main__":
    main()