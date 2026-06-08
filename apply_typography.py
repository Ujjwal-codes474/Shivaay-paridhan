import os
import re

old_font_link_regex = r'<link[^>]*href="https://fonts\.googleapis\.com/css2\?family=Playfair\+Display.*?family=Poppins.*?"[^>]*>'
new_font_link = '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">'

# 1. Update HTML files
for filename in os.listdir('.'):
    if filename.endswith('.html'):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = re.sub(old_font_link_regex, new_font_link, content, flags=re.IGNORECASE)
        
        if new_content != content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated fonts in {filename}")

# 2. Update CSS files
for filename in ['main.css', 'premium-redesign.css', 'landing.css', 'style_new.css', 'shared.css', 'offer-timer.css', 'coupons.css']:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content.replace("'Playfair Display'", "'Cormorant Garamond'")
        new_content = new_content.replace('"Playfair Display"', "'Cormorant Garamond'")
        new_content = new_content.replace('Playfair Display', 'Cormorant Garamond')
        
        new_content = new_content.replace("'Poppins'", "'Inter'")
        new_content = new_content.replace('"Poppins"', "'Inter'")
        new_content = new_content.replace('Poppins', 'Inter')
        
        if new_content != content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated font references in {filename}")
