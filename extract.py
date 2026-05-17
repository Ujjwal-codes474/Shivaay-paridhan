with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch.txt', 'w', encoding='utf-8') as f:
    f.writelines(lines[118:280])
