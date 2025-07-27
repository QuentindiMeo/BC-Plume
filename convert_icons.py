# Script pour convertir les icônes SVG en PNG
# Vous pouvez utiliser ce script si vous avez Python avec les bonnes dépendances
# Sinon, vous pouvez utiliser un outil en ligne pour convertir les SVG en PNG

try:
    from PIL import Image
    import cairosvg
    import io
    
    def convert_svg_to_png(svg_path, png_path, size):
        # Convertir SVG en PNG
        png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
        
        # Sauvegarder le PNG
        with open(png_path, 'wb') as f:
            f.write(png_data)
        
        print(f"Converti: {svg_path} -> {png_path}")
    
    # Convertir les icônes
    convert_svg_to_png('icons/icon16.svg', 'icons/icon16.png', 16)
    convert_svg_to_png('icons/icon48.svg', 'icons/icon48.png', 48)
    convert_svg_to_png('icons/icon128.svg', 'icons/icon128.png', 128)
    
    print("Toutes les icônes ont été converties avec succès!")
    
except ImportError:
    print("Pour convertir les SVG en PNG, installez les dépendances :")
    print("pip install Pillow cairosvg")
    print("Ou utilisez un outil en ligne pour convertir les fichiers SVG en PNG")
    print("Les tailles requises sont : 16x16, 48x48, et 128x128 pixels")
