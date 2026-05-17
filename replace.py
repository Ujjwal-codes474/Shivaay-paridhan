with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

with open('scratch.txt', 'r', encoding='utf-8') as f:
    target = f.read()

replacement = '''  <!-- ══════════ FRESH ARRIVALS — HORIZONTAL SCROLL ══════════ -->
  <section class="fresh-arrivals" id="collection">
    <div class="doodle-bg pattern-floral"></div>
    <div class="container">
      <div class="section-header">
        <p class="section-eyebrow">Fresh Arrivals</p>
        <h2 class="section-title">Latest Masterpieces</h2>
        <p class="section-sub">Discover our newest additions, crafted with precision and love.</p>
      </div>
      
      <div class="horizontal-scroll-wrapper">
        <button class="scroll-btn prev-btn" aria-label="Scroll left" onclick="scrollCarousel(-1)">❮</button>
        <div class="horizontal-scroll-container" id="freshArrivalsScroll">
          <!-- Card 1 -->
          <a href="product.html" class="product-card" style="text-decoration:none">
            <div class="card-image-wrap">
              <img src="images/saree1.png" alt="Crimson Silk Saree" class="card-img" loading="lazy">
              <span class="card-badge">Bestseller</span>
              <div class="card-overlay">
                <button class="card-btn" onclick="event.preventDefault(); addToCart(1, this)">Add to Cart</button>
              </div>
            </div>
            <div class="card-info">
              <p class="card-category">Banarasi Silk</p>
              <h3 class="card-name">Crimson Zari Saree</h3>
              <div class="card-footer">
                <span class="card-price">₹4,299</span>
                <span class="card-old-price">₹5,999</span>
                <span class="card-discount">28% OFF</span>
              </div>
            </div>
          </a>
          <!-- Card 2 -->
          <a href="product.html" class="product-card" style="text-decoration:none">
            <div class="card-image-wrap">
              <img src="images/saree2.png" alt="Blush Pink Saree" class="card-img" loading="lazy">
              <span class="card-badge new-badge">New</span>
              <div class="card-overlay">
                <button class="card-btn" onclick="event.preventDefault(); addToCart(2, this)">Add to Cart</button>
              </div>
            </div>
            <div class="card-info">
              <p class="card-category">Banarasi Silk</p>
              <h3 class="card-name">Blush Bridal Saree</h3>
              <div class="card-footer">
                <span class="card-price">₹6,499</span>
                <span class="card-old-price">₹8,000</span>
                <span class="card-discount">18% OFF</span>
              </div>
            </div>
          </a>
          <!-- Card 3 -->
          <a href="product.html" class="product-card" style="text-decoration:none">
            <div class="card-image-wrap">
              <img src="images/saree3.png" alt="Emerald Kanjivaram Saree" class="card-img" loading="lazy">
              <div class="card-overlay">
                <button class="card-btn" onclick="event.preventDefault(); addToCart(3, this)">Add to Cart</button>
              </div>
            </div>
            <div class="card-info">
              <p class="card-category">Kanjivaram Silk</p>
              <h3 class="card-name">Emerald Temple Saree</h3>
              <div class="card-footer">
                <span class="card-price">₹7,999</span>
                <span class="card-old-price">₹10,500</span>
                <span class="card-discount">23% OFF</span>
              </div>
            </div>
          </a>
          <!-- Card 4 -->
          <a href="product.html" class="product-card" style="text-decoration:none">
            <div class="card-image-wrap">
              <img src="images/saree4.png" alt="Ivory Bridal Saree" class="card-img" loading="lazy">
              <span class="card-badge">Bridal</span>
              <div class="card-overlay">
                <button class="card-btn" onclick="event.preventDefault(); addToCart(4, this)">Add to Cart</button>
              </div>
            </div>
            <div class="card-info">
              <p class="card-category">Pure Silk</p>
              <h3 class="card-name">Ivory Bridal Saree</h3>
              <div class="card-footer">
                <span class="card-price">₹12,999</span>
                <span class="card-old-price">₹16,000</span>
                <span class="card-discount">18% OFF</span>
              </div>
            </div>
          </a>
          <!-- Card 5 -->
          <a href="product.html" class="product-card" style="text-decoration:none">
            <div class="card-image-wrap">
              <img src="images/saree5.png" alt="Navy Sequin Saree" class="card-img" loading="lazy">
              <span class="card-badge new-badge">New</span>
              <div class="card-overlay">
                <button class="card-btn" onclick="event.preventDefault(); addToCart(5, this)">Add to Cart</button>
              </div>
            </div>
            <div class="card-info">
              <p class="card-category">Chiffon</p>
              <h3 class="card-name">Navy Sequin Saree</h3>
              <div class="card-footer">
                <span class="card-price">₹3,199</span>
                <span class="card-old-price">₹4,500</span>
                <span class="card-discount">28% OFF</span>
              </div>
            </div>
          </a>
        </div>
        <button class="scroll-btn next-btn" aria-label="Scroll right" onclick="scrollCarousel(1)">❯</button>
      </div>
    </div>
    <div class="doodle-divider"></div>
  </section>
'''

if target in content:
    new_content = content.replace(target, replacement)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced')
else:
    print('Target not found')
