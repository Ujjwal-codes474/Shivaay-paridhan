import os

admin_file = 'admin.html'

with open(admin_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the search bar
search_html = """      <div class="nav-center">
        <div class="search-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon-inline" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" id="search-input" placeholder="Search for products, categories..." class="nav-search-input">
        </div>
      </div>"""

content = content.replace(search_html + '\n\n', '')
content = content.replace(search_html, '')

# We will also rewrite the dashboard stats to use cleaner icons and markup.
# Right now, they use a standard `.stat-card`
# Let's replace the inline CSS block for Admin Layout with our premium version in premium-redesign.css
# Actually, the user wants "Premium fashion brand backend" so the existing CSS in admin.html can be preserved but tweaked.

with open(admin_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin.html")
