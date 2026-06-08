import os

admin_link = '<a href="admin.html" class="nav-link" onclick="closeMenu()">Admin Dashboard ⚙️</a>'

search_html = """      <div class="nav-center">
        <div class="search-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon-inline" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" id="search-input" placeholder="Search for products, categories..." class="nav-search-input">
        </div>
      </div>"""

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content.replace(admin_link + '\n      ', '')
        new_content = new_content.replace(admin_link, '')
        
        if filename in ['about.html', 'contact.html']:
            new_content = new_content.replace(search_html + '\n\n', '')
            new_content = new_content.replace(search_html, '')

        if new_content != content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filename}")
