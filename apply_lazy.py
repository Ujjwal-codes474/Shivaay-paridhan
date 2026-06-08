import os
import glob
import re

html_files = glob.glob('c:/Shivaay paridhaan/*.html')
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add lazy loading
    new_content = content.replace('<img src=', '<img loading="lazy" src=')
    new_content = new_content.replace('loading="lazy" loading="lazy"', 'loading="lazy"')
    
    # Exclude lazy loading from hero images
    new_content = new_content.replace('<img loading="lazy" src="images/hero_model.png"', '<img src="images/hero_model.png"')
    new_content = new_content.replace('<img loading="lazy" src="images/model1.jpeg"', '<img src="images/model1.jpeg"')

    # Fix index.html inline CSS issues causing horizontal scroll
    if file.endswith('index.html'):
        # Fix hero slider overflow
        new_content = new_content.replace(
            '.hero-slider {\n      position: relative !important;\n      width: 100% !important;',
            '.hero-slider {\n      position: relative !important;\n      width: 100vw !important;\n      max-width: 100% !important;'
        )
        new_content = new_content.replace(
            '<body class="home-page">',
            '<body class="home-page" style="max-width: 100vw; overflow-x: hidden;">'
        )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f'Processed {len(html_files)} HTML files for lazy loading and responsive fixes.')
