with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  // Add Return Policy Section if it doesn't exist
  let returnItem = document.querySelector('[data-accordion="return"]');
  if (!returnItem) {
    const accordionContainer = document.querySelector('.accordion-container');
    if (accordionContainer) {
      returnItem = document.createElement('div');
      returnItem.className = 'accordion-item';
      returnItem.setAttribute('data-accordion', 'return');
      returnItem.innerHTML = `
        <div class="accordion-header">
          <h3>🔄 Return Policy</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content">
          <p>${policies.returnPolicy || 'Easy 7-day returns.'}</p>
        </div>
      `;
      accordionContainer.appendChild(returnItem);
      // Re-init listeners for the new item
      initAccordion();
    }
  } else {
    const returnContent = returnItem.querySelector('.accordion-content');
    if (returnContent) returnContent.innerHTML = `<p>${policies.returnPolicy || 'Easy 7-day returns.'}</p>`;
  }'''

replacement = '''  // Strict Return Policy Update
  let returnItem = document.querySelector('[data-accordion="return"]');
  const returnPolicyHtml = `
    <div style="padding-top: 10px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 15px;">
        <span style="background:var(--black); color:var(--gold); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">No Refund</span>
        <span style="background:rgba(201,168,76,0.15); color:var(--gold-dark); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">Exchange Available</span>
        <span style="background:#ffebee; color:#d32f2f; padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">📹 Video Proof Required</span>
      </div>
      <ul style="list-style-type: disc; margin-bottom: 15px;">
        <li><strong>No Refund Policy</strong> - We do not offer refunds under any circumstances.</li>
        <li>Only exchanges are allowed for defective or damaged items.</li>
        <li>Return request must be raised within <strong>3 days</strong> of delivery.</li>
      </ul>
      <div style="background:#fff3e0; border-left:4px solid #ff9800; padding:12px; border-radius:4px; font-size:0.9rem;">
        <strong style="color:#e65100; display:block; margin-bottom:5px;">⚠️ IMPORTANT RULE FOR EXCHANGE:</strong>
        Customer MUST provide:
        <ul style="margin-top:5px; margin-bottom:0; padding-left:20px;">
          <li>Proper <strong>unboxing video</strong> from start to end (no cuts or edits).</li>
          <li>Clear photos of the defect at delivery time.</li>
        </ul>
        <p style="margin-top:8px; margin-bottom:0; font-weight:600; color:#d32f2f;">Without proof → return/exchange will be strictly rejected.</p>
      </div>
    </div>
  `;

  if (!returnItem) {
    const accordionContainer = document.querySelector('.accordion-container');
    if (accordionContainer) {
      returnItem = document.createElement('div');
      returnItem.className = 'accordion-item';
      returnItem.setAttribute('data-accordion', 'return');
      returnItem.innerHTML = `
        <div class="accordion-header">
          <h3>🔄 Return & Exchange Policy</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content">
          ${returnPolicyHtml}
        </div>
      `;
      accordionContainer.appendChild(returnItem);
      initAccordion();
    }
  } else {
    returnItem.querySelector('h3').textContent = '🔄 Return & Exchange Policy';
    const returnContent = returnItem.querySelector('.accordion-content');
    if (returnContent) returnContent.innerHTML = returnPolicyHtml;
  }
'''

if target in content:
    content = content.replace(target, replacement)
    print("Replaced return policy script.")
else:
    print("Target return policy not found!")


target_shipping = """  // Shipping & Return Policies (Global)
  const policies = window.globalPolicies || { shippingPolicy: '', returnPolicy: '' };
  
  const shippingContent = document.querySelector('[data-accordion="shipping"] .accordion-content');
  if (shippingContent) {
    shippingContent.innerHTML = `<p>${policies.shippingPolicy || 'Standard shipping takes 3-5 business days.'}</p>`;
  }"""

replacement_shipping = """  // Shipping & Return Policies (Global)
  const policies = window.globalPolicies || { shippingPolicy: '', returnPolicy: '' };
  
  const shippingContent = document.querySelector('[data-accordion="shipping"] .accordion-content');
  if (shippingContent) {
    shippingContent.innerHTML = `
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="margin-bottom: 10px;">🚚 <strong>Delivery:</strong> 3–5 business days globally.</li>
        <li style="margin-bottom: 10px;">🔄 <strong>Exchange:</strong> Easy exchange available within 3 days.</li>
        <li style="margin-bottom: 10px;">💬 <strong>Support:</strong> 24/7 Support via WhatsApp.</li>
      </ul>
      <p style="margin-top: 15px; font-size: 0.85rem; color: #666;">We partner with premium logistics to ensure safe and timely delivery of your luxury handlooms.</p>
    `;
  }"""

if target_shipping in content:
    content = content.replace(target_shipping, replacement_shipping)
    print("Replaced shipping policy script.")
else:
    print("Target shipping policy not found!")

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
