#!/usr/bin/env python3

"""
Image Processing Engine Helper (Phase 3)
Provides high-performance image processing using Pillow:
- Auto-rotates using EXIF orientation
- Strips all EXIF/GPS/ICC metadata
- Validates dimensions (max 6000px)
- Generates responsive WebP variants (480, 768, 1200, 1920; never upscales)
- Generates tiny 16px blur placeholder base64 Data URL
Input/Output via JSON stdout.
"""

import sys
import os
import json
import base64
import io
from PIL import Image, ImageOps

def process_image(input_path, output_dir, file_prefix, breakpoints=[480, 768, 1200, 1920]):
    try:
        im = Image.open(input_path)
    except Exception as e:
        return {"error": f"Invalid image content: {str(e)}"}

    # Auto-rotate based on EXIF
    try:
        im = ImageOps.exif_transpose(im)
    except Exception:
        pass

    orig_width, orig_height = im.size

    # Validate max dimension
    if orig_width > 6000 or orig_height > 6000:
        return {"error": "DIMENSION_TOO_LARGE", "width": orig_width, "height": orig_height}

    # Convert to RGB if RGBA/P/other for clean WebP
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')

    os.makedirs(output_dir, exist_ok=True)

    # Filter breakpoints: only include those strictly smaller than original, plus the original size
    target_widths = [w for w in breakpoints if w < orig_width]
    if orig_width not in target_widths:
        target_widths.append(orig_width)
    target_widths.sort()

    variants = {}

    for w in target_widths:
        h = max(1, int(orig_height * (w / orig_width)))
        resized = im.resize((w, h), Image.Resampling.LANCZOS)
        out_filename = f"{file_prefix}-{w}.webp"
        out_filepath = os.path.join(output_dir, out_filename)
        # Strip metadata by not passing exif/icc_profile
        resized.save(out_filepath, "WEBP", quality=82, method=6)
        file_bytes = os.path.getsize(out_filepath)
        variants[str(w)] = {
            "key": out_filename,
            "url": f"/uploads/{out_filename}",
            "width": w,
            "height": h,
            "bytes": file_bytes
        }

    # Generate master variant (highest resolution)
    master_key = f"{file_prefix}-{orig_width}.webp"

    # Generate tiny blur placeholder (16px wide)
    blur_w = 16
    blur_h = max(1, int(orig_height * (blur_w / orig_width)))
    blur_im = im.resize((blur_w, blur_h), Image.Resampling.BOX)
    blur_buffer = io.BytesIO()
    blur_im.save(blur_buffer, "WEBP", quality=30)
    blur_base64 = "data:image/webp;base64," + base64.b64encode(blur_buffer.getvalue()).decode("ascii")

    return {
        "success": True,
        "width": orig_width,
        "height": orig_height,
        "masterKey": master_key,
        "bytes": variants[str(orig_width)]["bytes"],
        "variants": variants,
        "blurDataUrl": blur_base64
    }

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: process-image.py <input_path> <output_dir> <prefix>"}))
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    prefix = sys.argv[3]

    res = process_image(input_path, output_dir, prefix)
    print(json.dumps(res))
