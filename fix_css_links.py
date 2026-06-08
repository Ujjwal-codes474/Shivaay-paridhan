import os
import re

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'premium-redesign.css' not in content:
            # Inject it after main.css
            new_content = re.sub(
                r'(<link[^>]*href="main\.css"[^>]*>)',
                r'\1\n<link rel="stylesheet" href="premium-redesign.css?v=4">',
                content,
                flags=re.IGNORECASE
            )
            # If main.css wasn't found, just inject it before </head>
            if new_content == content:
                new_content = re.sub(
                    r'(</head>)',
                    r'<link rel="stylesheet" href="premium-redesign.css?v=4">\n\1',
                    content,
                    flags=re.IGNORECASE
                )
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Added premium-redesign.css to {filename}")
