"""Run with Pillow installed. Generate versioned WebP variants from JPEG sources.
Existing asset URLs are retained for compatibility with cached HTML.
"""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1] / 'assets' / 'img'
for name in ('hero', 'chapel', 'lodge-timber', 'rafting'):
    for suffix in ('-sm', ''):
        source = root / f'{name}{suffix}.jpg'
        target = root / f'{name}{suffix}-v2.webp'
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            image.save(target, 'WEBP', quality=45, method=6)
        old = root / f'{name}{suffix}.webp'
        print(f'{target.name}: {old.stat().st_size:,} → {target.stat().st_size:,} bytes')
