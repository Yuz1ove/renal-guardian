from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
W, H = 4961, 3508

COLORS = {
    "paper": (247, 249, 248),
    "mist": (224, 237, 232),
    "ink": (25, 39, 48),
    "muted": (65, 80, 90),
    "teal": (39, 130, 123),
    "gold": (217, 181, 79),
    "coral": (199, 91, 86),
    "white": (255, 255, 255),
    "dark": (18, 31, 38),
}


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size, index=1 if bold and path.endswith(".ttc") else 0)
    return ImageFont.load_default(size=size)


F = {
    "hero": font(330, True),
    "h1": font(160, True),
    "h2": font(92, True),
    "h3": font(70, True),
    "body": font(54),
    "small": font(42),
    "code": font(46),
}


def wrap(draw, text, width, face):
    lines = []
    current = ""
    for char in text:
        trial = current + char
        if draw.textlength(trial, font=face) <= width or not current:
            current = trial
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    return lines


def paragraph(draw, xy, text, width, face, fill=COLORS["muted"], leading=1.38):
    x, y = xy
    for line in wrap(draw, text, width, face):
        draw.text((x, y), line, font=face, fill=fill)
        y += int(face.size * leading)
    return y


def card(draw, box, title, body, accent=COLORS["teal"]):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=24, fill=COLORS["white"], outline=(219, 226, 224), width=3)
    draw.rectangle((x1, y1, x1 + 18, y2), fill=accent)
    draw.text((x1 + 72, y1 + 62), title, font=F["h3"], fill=accent)
    paragraph(draw, (x1 + 72, y1 + 170), body, x2 - x1 - 130, F["body"], COLORS["muted"])


def remove_render_background(img):
    rgba = img.convert("RGBA")
    cleaned = []
    for r, g, b, a in rgba.getdata():
        near_stage_bg = abs(r - 238) + abs(g - 243) + abs(b - 241) < 28
        pale_green_bg = 224 < r < 248 and 232 < g < 251 and 229 < b < 250 and g >= r
        if near_stage_bg or pale_green_bg:
            cleaned.append((255, 255, 255, 0))
        else:
            cleaned.append((r, g, b, a))
    rgba.putdata(cleaned)
    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def contain(img, max_width, max_height):
    ratio = min(max_width / img.width, max_height / img.height)
    size = (int(img.width * ratio), int(img.height * ratio))
    return img.resize(size, Image.Resampling.LANCZOS)


def load_product_render():
    source = ROOT / "verification-cutout.png"
    if not source.exists():
        source = ROOT / "verification-desktop-adjusted.png"
    return remove_render_background(Image.open(source)).filter(
        ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=3)
    )


def panel_one():
    img = Image.new("RGB", (W, H), COLORS["paper"])
    draw = ImageDraw.Draw(img)
    render = contain(load_product_render(), 2850, 1550)

    draw.text((260, 320), "2026 ICARE UNIVERSAL DESIGN", font=F["small"], fill=COLORS["teal"])
    draw.text((260, 410), "腎安守護", font=F["hero"], fill=COLORS["ink"])
    paragraph(
        draw,
        (280, 900),
        "洗腎患者真正危險的時刻，不只是在透析室，而是在離開透析室後的返家與居家恢復期。",
        1320,
        F["body"],
        COLORS["muted"],
    )

    model_box = (1720, 300, 4700, 1990)
    draw.rounded_rectangle(model_box, radius=28, fill=COLORS["mist"], outline=(203, 216, 212), width=4)
    render_x = model_box[0] + (model_box[2] - model_box[0] - render.width) // 2
    render_y = model_box[1] + (model_box[3] - model_box[1] - render.height) // 2 + 45
    img.paste(render, (render_x, render_y), render)

    card(draw, (260, 2200, 1630, 3150), "佩戴裝置", "洗腎者隨身佩戴，畫面顯示時間、心率、血壓與跌倒偵測狀態，讓返家途中風險不中斷。")
    card(draw, (1795, 2200, 3165, 3150), "床邊檢測器", "追蹤被照顧者是否有正常活動，必要時報警求救，也支援看護人員遠端對話聯繫。")
    card(draw, (3330, 2200, 4700, 3150), "辦公室看板", "居服員辦公室同步多位個案健康指數，低於門檻時立即派員前往協助。")
    return img


def panel_two():
    img = Image.new("RGB", (W, H), (242, 246, 244))
    draw = ImageDraw.Draw(img)

    draw.text((260, 270), "PRODUCT SYSTEM", font=F["small"], fill=COLORS["teal"])
    draw.text((260, 360), "透析後返家風險守護系統", font=F["h1"], fill=COLORS["ink"])

    steps = [
        ("1  佩戴監測", "時間、心率、血壓與跌倒偵測顯示在洗腎者佩戴裝置。"),
        ("2  床邊確認", "床邊檢測器確認活動狀態，異常時可報警求救。"),
        ("3  對話聯繫", "看護或居服員可透過床邊設備與被照顧者對話。"),
        ("4  派員協助", "辦公室看板即時排序健康指數，低於門檻立即前往。"),
    ]
    y = 720
    for i, (title, body) in enumerate(steps):
        color = [COLORS["teal"], COLORS["gold"], COLORS["coral"], COLORS["ink"]][i]
        draw.rounded_rectangle((300, y, 2350, y + 430), radius=24, fill=COLORS["white"], outline=(217, 225, 222), width=3)
        draw.rectangle((300, y, 330, y + 430), fill=color)
        draw.text((390, y + 70), title, font=F["h2"], fill=color)
        paragraph(draw, (400, y + 205), body, 1740, F["body"], COLORS["muted"])
        y += 520

    draw.rounded_rectangle((2660, 720, 4660, 2200), radius=28, fill=(226, 238, 233), outline=(203, 216, 212), width=4)
    draw.text((2800, 865), "三端式照護系統", font=F["h2"], fill=COLORS["ink"])
    bullets = [
        "洗腎者佩戴裝置：時間、心率、血壓、跌倒偵測。",
        "床邊檢測器：活動狀態、報警求救、雙向對話。",
        "辦公室看板：多人即時健康指數、低分派員。",
    ]
    yy = 1060
    for item in bullets:
        draw.ellipse((2810, yy + 24, 2850, yy + 64), fill=COLORS["teal"])
        yy = paragraph(draw, (2885, yy), item, 1520, F["body"], COLORS["muted"]) + 36

    code_box = (2660, 2390, 4660, 3150)
    draw.rounded_rectangle(code_box, radius=24, fill=COLORS["dark"])
    draw.text((2800, 2510), "基礎風險程式邏輯", font=F["h3"], fill=(159, 228, 217))
    code = "health = 100 - (bpRisk + heartRisk + activityRisk + fallRisk)\nif health <= 40: dispatchCareWorker()\nif fallDetected: alarmAndOpenCall()"
    draw.multiline_text((2800, 2660), code, font=F["code"], fill=COLORS["white"], spacing=24)

    return img


def cutout():
    crop = contain(load_product_render(), 3600, 2100)
    canvas = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    canvas.alpha_composite(crop, ((W - crop.width) // 2, (H - crop.height) // 2))
    return canvas


def save_jpeg(img, path, quality=92):
    rgb = img.convert("RGB")
    rgb.save(path, "JPEG", quality=quality, optimize=True, progressive=True, dpi=(300, 300))


def main():
    panel1 = panel_one()
    panel2 = panel_two()
    product = cutout()
    save_jpeg(panel1, ROOT / "作品設計圖檔1-腎安守護.jpg", 91)
    save_jpeg(panel2, ROOT / "作品設計圖檔2-腎安守護.jpg", 91)
    product.save(ROOT / "作品去背圖檔-腎安守護.png", "PNG", optimize=True, dpi=(300, 300))
    white = Image.new("RGB", product.size, COLORS["white"])
    white.paste(product, mask=product.getchannel("A"))
    white.save(ROOT / "作品去背圖檔-腎安守護.jpg", "JPEG", quality=92, optimize=True, progressive=True, dpi=(300, 300))


if __name__ == "__main__":
    main()
