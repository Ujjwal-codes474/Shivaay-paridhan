import os
import re

# Google Fonts used by the redesigned UI
old_font_link_regex = (
    r'<link[^>]*href="https://fonts\.googleapis\.com/css2\?'
    r'family=Playfair\+Display.*?family=Poppins.*?"[^>]*>'
)

new_font_link = (
    '<link href="https://fonts.googleapis.com/css2?'
    'family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400'
    '&family=Inter:wght@300;400;500;600&display=swap" '
    'rel="stylesheet">'
)

# ---------------------------------------------------------
# 1. Update fonts in HTML files
# ---------------------------------------------------------

for filename in os.listdir("."):
    if not filename.endswith(".html"):
        continue

    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = re.sub(
        old_font_link_regex,
        new_font_link,
        content,
        flags=re.IGNORECASE
    )

    if new_content != content:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_content)

        print(f"Updated fonts in {filename}")


# ---------------------------------------------------------
# 2. Update fonts only in active CSS files
# ---------------------------------------------------------

active_css_files = [
    "main.css",
    "premium-redesign.css",
    "offer-timer.css",
    "coupons.css",
    "ui-redesign.css",
    "ui-fix-v3.css",
    "ui-refined.css",
]

for filename in active_css_files:
    if not os.path.exists(filename):
        continue

    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content

    # Playfair Display → Cormorant Garamond
    new_content = new_content.replace(
        "'Playfair Display'",
        "'Cormorant Garamond'"
    )
    new_content = new_content.replace(
        '"Playfair Display"',
        '"Cormorant Garamond"'
    )
    new_content = new_content.replace(
        "Playfair Display",
        "Cormorant Garamond"
    )

    # Poppins → Inter
    new_content = new_content.replace(
        "'Poppins'",
        "'Inter'"
    )
    new_content = new_content.replace(
        '"Poppins"',
        '"Inter"'
    )
    new_content = new_content.replace(
        "Poppins",
        "Inter"
    )

    if new_content != content:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_content)

        print(f"Updated font references in {filename}")

print("\nTypography update complete.")