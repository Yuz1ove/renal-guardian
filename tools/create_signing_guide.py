from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "submission" / "signing_aid"

GUIDES = [
    {
        "attachment": ROOT / "submission" / "renal_guardian_submission" / "attachment_1_commitment.pdf",
        "render_prefix": OUT_DIR / "attachment_1_render",
        "rendered": OUT_DIR / "attachment_1_render-1.png",
        "guide_png": OUT_DIR / "attachment_1_signature_guide.png",
        "guide_pdf": OUT_DIR / "attachment_1_signature_guide.pdf",
        "box": (0.12, 0.735, 0.88, 0.79),
        "note": (0.15, 0.62, 0.88, 0.70),
        "title": "附件一：請在下方「立同意書人簽名」欄親筆簽名或蓋章",
        "subtitle": "簽名後掃描成 PDF，再用 package:submission 指令替換附件一",
    },
    {
        "attachment": ROOT / "submission" / "renal_guardian_submission" / "attachment_2_copyright_authorization.pdf",
        "render_prefix": OUT_DIR / "attachment_2_render",
        "rendered": OUT_DIR / "attachment_2_render-1.png",
        "guide_png": OUT_DIR / "attachment_2_signature_guide.png",
        "guide_pdf": OUT_DIR / "attachment_2_signature_guide.pdf",
        "box": (0.12, 0.76, 0.88, 0.84),
        "note": (0.15, 0.62, 0.88, 0.71),
        "title": "附件二：請在下方「授權人 / 簽名」欄親筆簽名或蓋章",
        "subtitle": "簽名後掃描成 PDF，再用 package:submission 指令替換附件二",
    },
    {
        "attachment": ROOT / "submission" / "renal_guardian_submission" / "attachment_3_personal_data_consent.pdf",
        "render_prefix": OUT_DIR / "attachment_3_render",
        "rendered": OUT_DIR / "attachment_3_render-1.png",
        "guide_png": OUT_DIR / "attachment_3_signature_date_guide.png",
        "guide_pdf": OUT_DIR / "attachment_3_signature_date_guide.pdf",
        "box": (0.12, 0.73, 0.88, 0.84),
        "note": (0.15, 0.58, 0.88, 0.69),
        "title": "附件三：請在「立同意書人」簽章，並填寫日期",
        "subtitle": "簽名與日期完成後掃描成 PDF，再替換附件三",
    },
]


def font(size):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size, index=0)
    return ImageFont.load_default()


def render_attachment(guide):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "pdftoppm",
            "-png",
            "-r",
            "180",
            str(guide["attachment"]),
            str(guide["render_prefix"]),
        ],
        check=True,
    )
    rendered = guide["rendered"]
    if not rendered.exists():
        raise FileNotFoundError(rendered)
    return rendered


def draw_guide(guide, rendered_path):
    img = Image.open(rendered_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    w, h = img.size

    box = tuple(int(value * (w if index % 2 == 0 else h)) for index, value in enumerate(guide["box"]))
    red = (220, 48, 55)
    amber = (255, 245, 220)

    draw.rounded_rectangle(box, radius=12, outline=red, width=8)
    note = tuple(int(value * (w if index % 2 == 0 else h)) for index, value in enumerate(guide["note"]))
    draw.rounded_rectangle(note, radius=18, fill=amber, outline=red, width=4)
    draw.text(
        (note[0] + 28, note[1] + 18),
        guide["title"],
        font=font(38),
        fill=red,
    )
    draw.text(
        (note[0] + 28, note[1] + 72),
        guide["subtitle"],
        font=font(26),
        fill=(70, 70, 70),
    )

    # Arrow from note to the signature line.
    start = (int(w * 0.52), note[3] + 12)
    end = (int(w * 0.38), box[1] - 10)
    draw.line([start, end], fill=red, width=8)
    draw.polygon(
        [
            (end[0], end[1]),
            (end[0] - 18, end[1] - 32),
            (end[0] + 26, end[1] - 22),
        ],
        fill=red,
    )

    img.save(guide["guide_png"], "PNG", optimize=True)
    return guide["guide_png"]


def make_pdf(guide, png_path):
    img = Image.open(png_path)
    c = canvas.Canvas(str(guide["guide_pdf"]), pagesize=A4)
    page_w, page_h = A4
    margin = 10 * mm
    max_w = page_w - margin * 2
    max_h = page_h - margin * 2
    scale = min(max_w / img.width, max_h / img.height)
    draw_w = img.width * scale
    draw_h = img.height * scale
    x = (page_w - draw_w) / 2
    y = (page_h - draw_h) / 2
    c.drawImage(str(png_path), x, y, width=draw_w, height=draw_h)
    c.save()
    return guide["guide_pdf"]


def main():
    for guide in GUIDES:
        rendered = render_attachment(guide)
        guide_png = draw_guide(guide, rendered)
        guide_pdf = make_pdf(guide, guide_png)
        print(f"Generated {guide_png}")
        print(f"Generated {guide_pdf}")


if __name__ == "__main__":
    main()
