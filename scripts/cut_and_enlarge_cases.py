import os
import sys
from PIL import Image
from rembg import remove, new_session

sys.stdout.reconfigure(line_buffering=True)

brain_dir = r"C:\Users\taras\.gemini\antigravity\brain\6a3e46d7-8f8b-41b1-a4db-95a9e9f32d31"
dest_dir = r"public\cases"

mapping = {
    "case_cyber_protocol.webp": "nano_banana_cyber",
    "case_inferno_banana_rush.webp": "inferno_banana_rush",
    "case_gold_bar_24k.webp": "nano_banana_gold",
    "case_quantum_dimension.webp": "quantum_banana_core",
    "case_monkey_business.webp": "monkey_business_bananas",
    "case_mecha_overdrive.webp": "mecha_banana_overdrive",
    "case_toxic_biohazard.webp": "toxic_banana_biohazard",
    "case_casino_jackpot_ultra.webp": "banana_jackpot_ultra",
}

print("Initializing rembg session with u2netp (super fast, clean)...")
session = new_session('u2netp')
print("Session ready.")

brain_files = os.listdir(brain_dir)

for dest_name, prefix in mapping.items():
    match = next((f for f in brain_files if f.startswith(prefix) and f.endswith(".jpg")), None)
    if not match:
        print(f"Error: Could not find image for {prefix}")
        continue

    src_path = os.path.join(brain_dir, match)
    print(f"Processing {match} -> {dest_name}...")
    im = Image.open(src_path).convert("RGB")
    im.thumbnail((512, 512), Image.Resampling.LANCZOS)

    # Cut out background with u2netp
    cut = remove(im, session=session)

    # Tight crop to content bounding box
    bbox = cut.getbbox()
    if bbox:
        cropped = cut.crop(bbox)
    else:
        cropped = cut

    # Enlarge and center in 512x512 with 16px padding so it fills the frame like standard CS2 crates
    target_canvas_size = 512
    padding = 16
    max_content_size = target_canvas_size - (padding * 2)

    # Scale maintaining aspect ratio
    w_ratio = max_content_size / cropped.width
    h_ratio = max_content_size / cropped.height
    scale = min(w_ratio, h_ratio)
    new_w = int(cropped.width * scale)
    new_h = int(cropped.height * scale)

    resized_content = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (target_canvas_size, target_canvas_size), (0, 0, 0, 0))
    paste_x = (target_canvas_size - new_w) // 2
    paste_y = (target_canvas_size - new_h) // 2
    canvas.paste(resized_content, (paste_x, paste_y), resized_content)

    # Save as transparent WebP
    out_path = os.path.join(dest_dir, dest_name)
    canvas.save(out_path, "WEBP", quality=95)

    # Also save png version
    png_name = dest_name.replace(".webp", ".png")
    canvas.save(os.path.join(dest_dir, png_name), "PNG")

    print(f"Done! Saved {out_path} and {png_name} (Content size: {new_w}x{new_h})")

print("All 8 cases processed successfully!")
