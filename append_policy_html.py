policy_html = '''
<!-- Global Policy Strip -->
<div class="global-policy-strip">
  <div class="container">
    <div class="policy-items">
      <div class="policy-item">
        <span class="policy-icon">🚚</span>
        <div>
          <h4>Global Delivery</h4>
          <p>3–5 business days</p>
        </div>
      </div>
      <div class="policy-item">
        <span class="policy-icon">🔄</span>
        <div>
          <h4>Easy Exchange</h4>
          <p>Available within 3 days</p>
        </div>
      </div>
      <div class="policy-item">
        <span class="policy-icon">💬</span>
        <div>
          <h4>24/7 Support</h4>
          <p>Via WhatsApp</p>
        </div>
      </div>
    </div>
  </div>
</div>

<footer class="site-footer"'''

files = ['index.html', 'product.html', 'checkout.html']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'global-policy-strip' not in content:
        content = content.replace('<footer class="site-footer"', policy_html)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added policy strip to {file}")
    else:
        print(f"Policy strip already in {file}")
