import io

with io.open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('class="hero-text-wrap"', 'class="hero-text"')

with io.open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
