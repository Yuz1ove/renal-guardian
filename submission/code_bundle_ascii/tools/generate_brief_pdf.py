from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "submission" / "renal_guardian_brief.pdf"
PRODUCT_IMAGE = ROOT / "作品去背圖檔-腎安守護.png"
PREVIEW_IMAGE = ROOT / "tmp" / "pdfs" / "brief_product_preview.jpg"


def register_font():
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            pdfmetrics.registerFont(TTFont("CJK", str(path), subfontIndex=0))
            return "CJK"
    return "Helvetica"


FONT = register_font()


def style(name, size, leading=None, color=colors.HexColor("#1d2630"), bold=False):
    return ParagraphStyle(
        name,
        fontName=FONT,
        fontSize=size,
        leading=leading or size * 1.35,
        textColor=color,
        spaceAfter=6,
        wordWrap="CJK",
        splitLongWords=True,
    )


STYLES = {
    "kicker": style("kicker", 8, 11, colors.HexColor("#2f8f86")),
    "title": style("title", 27, 34, colors.HexColor("#16222a")),
    "h2": style("h2", 14, 19, colors.HexColor("#2f8f86")),
    "body": style("body", 9.2, 14, colors.HexColor("#3d4a52")),
    "small": style("small", 8, 11.5, colors.HexColor("#4e5d66")),
    "white": style("white", 9, 13, colors.white),
}


def p(text, style_name="body"):
    return Paragraph(text, STYLES[style_name])


def prepare_product_preview():
    PREVIEW_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    source = PILImage.open(PRODUCT_IMAGE).convert("RGBA")
    source.thumbnail((1700, 950), PILImage.Resampling.LANCZOS)
    canvas = PILImage.new("RGB", source.size, "white")
    canvas.paste(source, mask=source.getchannel("A"))
    canvas.save(PREVIEW_IMAGE, "JPEG", quality=88, optimize=True, progressive=True)
    return PREVIEW_IMAGE


def section(title, body):
    return KeepTogether([p(title, "h2"), p(body, "body")])


def bullet(items):
    rows = []
    for item in items:
        rows.append([p("•", "body"), p(item, "body")])
    table = Table(rows, colWidths=[5 * mm, 76 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return table


def card(title, body, width):
    content = [[p(title, "h2")], [p(body, "small")]]
    table = Table(content, colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d8e3df")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def page_one():
    story = [
        p("2026 ICARE Universal Design", "kicker"),
        p("腎安守護", "title"),
        p(
            "洗腎患者真正危險的時刻，不只是在透析室，而是在離開透析室後的返家與居家恢復期。本系統補上醫療照護與家庭照護之間的空白，讓患者、家屬與照護團隊能在風險發生前採取行動。",
            "body",
        ),
        Spacer(1, 5 * mm),
    ]

    product = RLImage(str(prepare_product_preview()), width=155 * mm, height=85 * mm, kind="proportional")
    product.hAlign = "CENTER"
    story.extend([product, Spacer(1, 5 * mm)])

    cards = [
        card("1. 佩戴裝置", "時間、心率、血壓與跌倒偵測顯示在洗腎者佩戴裝置，讓返家途中風險不中斷。", 53 * mm),
        card("2. 床邊檢測器", "確認被照顧者是否有正常活動，必要時警報求救，並支援看護人員遠端對話。", 53 * mm),
        card("3. 辦公室看板", "同步多位被照顧者健康指數，低於門檻時立即標示派員協助。", 53 * mm),
    ]
    table = Table([cards], colWidths=[55 * mm, 55 * mm, 55 * mm])
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(table)
    story.append(Spacer(1, 5 * mm))
    story.append(
        section(
            "核心價值",
            "腎安守護把透析後返家恢復期視為照護流程的一部分，將生命徵象、活動狀態、跌倒偵測與照護派員整合成同一套可行動的健康指數。",
        )
    )
    return story


def page_two():
    story = [p("技術流程與驗證", "title")]
    story.append(
        section(
            "健康指數演算法",
            "示範程式以收縮壓、心率、活動指數與跌倒偵測作為輸入，轉換為風險分數後計算健康指數。健康指數 66 至 100 為穩定，41 至 65 為觀察，21 至 40 為派員確認，20 以下或偵測跌倒時為立即協助。",
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        bullet(
            [
                "網頁原型：Three.js 3D 模型可即時同步穿戴裝置、床邊檢測器與辦公室看板。",
                "硬體草稿：Arduino 風格程式示範感測、警報、通話與派員邏輯。",
                "投稿輸出：A3 設計圖、去背產品圖、GLB 3D 模型與示範程式碼已打包。",
                "驗證流程：npm run package:submission、npm run validate:submission 與 npm run build 已通過。",
            ]
        )
    )
    story.append(Spacer(1, 5 * mm))

    flow_rows = [
        [p("輸入", "white"), p("血壓、心率、活動指數、跌倒偵測", "white")],
        [p("判斷", "white"), p("轉換為風險分數並計算健康指數", "white")],
        [p("行動", "white"), p("低於門檻時辦公室派員，跌倒時開啟求救與通話", "white")],
    ]
    flow = Table(flow_rows, colWidths=[28 * mm, 132 * mm])
    flow.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#18313a")),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#2f8f86")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#18313a")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(flow)
    story.append(Spacer(1, 5 * mm))
    story.append(
        section(
            "後續發展",
            "正式產品可加入醫療級血壓量測、穿戴式心率模組、床邊毫米波或紅外線活動感測、資料加密傳輸、家屬通知、派工紀錄與長期趨勢分析。",
        )
    )
    story.append(
        section(
            "提交提醒",
            "附件一參賽單位承諾書與附件二著作授權同意書仍需親筆簽名或蓋章。簽名後依 signing_packet 內 README 指示替換 PDF、重新打包並執行 validate:submission。",
        )
    )
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title="腎安守護作品說明書",
        author="腎安守護",
    )
    story = page_one()
    story.append(PageBreak())
    story.extend(page_two())
    doc.build(story)
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
