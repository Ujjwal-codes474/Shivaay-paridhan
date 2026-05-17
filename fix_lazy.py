with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace('<img src=', '<img loading="lazy" src=')
new_content = new_content.replace('loading="lazy" loading="lazy"', 'loading="lazy"')
new_content = new_content.replace('<img loading="lazy" src="images/hero_model.png"', '<img src="images/hero_model.png"') # dont lazy load hero image

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Lazy load added to index.html')
