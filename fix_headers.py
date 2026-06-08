import os
import re

header_html = """<header class="navbar" id="navbar">
    <div class="nav-container">

      <div class="nav-left">
        <a href="index.html" class="nav-logo">
          <img loading="lazy" src="images/shivaay.jpeg" alt="Shivaay Paridhan" class="logo-img">
          <div class="brand-copy">
            <span class="logo-text-primary">Shivaay</span>
            <span class="logo-text-secondary">Paridhan</span>
          </div>
        </a>
      </div>

      <div class="nav-center">
        <div class="search-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon-inline" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" id="search-input" placeholder="Search for products, categories..." class="nav-search-input">
        </div>
      </div>

      <div class="nav-right">
        <a href="profile.html" class="nav-icon-btn" aria-label="Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </a>

        <a href="cart.html" class="nav-icon-btn cart-btn" aria-label="Shopping Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span class="cart-count" id="cart-count" style="display: none;">0</span>
        </a>

        <button class="nav-icon-btn menu-btn" id="menu-btn" onclick="toggleMenu()" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 17h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <nav class="nav-links" id="nav-links">
      <a href="index.html" class="nav-link" onclick="closeMenu()">Home</a>
      <a href="about.html" class="nav-link" onclick="closeMenu()">About Us</a>
      <a href="contact.html" class="nav-link" onclick="closeMenu()">Contact</a>
      <a href="shop.html" class="nav-link" onclick="closeMenu()">Shop</a>
      <a href="cart.html" class="nav-link" onclick="closeMenu()">Cart</a>
      <a href="admin.html" class="nav-link" onclick="closeMenu()">Admin Dashboard ⚙️</a>
      <a href="login.html" class="nav-link nav-login-btn" onclick="closeMenu()">Login</a>
      <a href="#" class="nav-link logout-btn" onclick="logout(); closeMenu()" style="display: none;">Logout</a>
    </nav>
  </header>"""

pattern = re.compile(r'<header[^>]*id="navbar"[^>]*>.*?</header>', re.DOTALL)

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if pattern.search(content):
            new_content = pattern.sub(header_html, content)
            if new_content != content:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated header in {filename}")
