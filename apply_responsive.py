with open('premium-redesign.css', 'a', encoding='utf-8') as f:
    f.write('''
/* ════════════════════════════════════════════════════════════════
   COMPREHENSIVE RESPONSIVE REFACTORING (Mobile First & Constraints)
   Targeting: 320px, 375px, 425px, 768px, 1024px, 1440px+
   ════════════════════════════════════════════════════════════════ */

/* --- 1. Global & Structural Fixes --- */
html, body {
  max-width: 100vw;
  overflow-x: hidden; /* Prevent horizontal scrolling entirely */
}

/* Ensure images never stretch and maintain aspect ratio */
img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
}

/* Base constraints for layout */
.container, .nav-container-premium, .category-container, .features-container, .hero-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* --- 2. Navigation Fixes --- */
@media (max-width: 1024px) {
  .nav-desktop-layout { display: none; }
  .nav-mobile-layout { 
    display: flex; 
    flex-direction: column; 
    width: 100%; 
  }
  .nav-mobile-row-one {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
  }
  .nav-mobile-row-two {
    padding: 10px 0;
  }
  .hamburger-mobile-btn {
    background: transparent;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 8px;
  }
  .hamburger-mobile-btn span {
    display: block;
    width: 24px;
    height: 2px;
    background: var(--text-dark);
    transition: 0.3s;
  }
  .nav-logo-mobile {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  .nav-logo-mobile .logo-img {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }
  .logo-text-mobile {
    font-family: var(--font-heading);
    font-weight: 700;
    color: var(--text-dark);
    font-size: 1.2rem;
  }
  .nav-mobile-actions-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .mobile-search-bar-container {
    position: relative;
    width: 100%;
  }
  .mobile-search-input-field {
    width: 100%;
    padding: 10px 40px 10px 16px;
    border-radius: 20px;
    border: 1px solid var(--border-light);
    font-family: var(--font-body);
    font-size: 0.9rem;
    box-sizing: border-box;
  }
  .mobile-search-icon-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text-muted);
  }
  
  /* Make sure the side drawer stays within the viewport */
  .nav-links {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 80vw;
    background: #ffffff;
    box-shadow: 4px 0 20px rgba(0,0,0,0.1);
    z-index: 2000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    padding: 60px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .nav-links.open {
    transform: translateX(0);
  }
}

/* --- 3. Hero Section (Typography Scaling) --- */
@media (max-width: 1024px) {
  .hero-text { max-width: 60%; }
}
@media (max-width: 768px) {
  .hero-slider .hero-content { padding: 40px 20px !important; }
  .hero-text { 
    max-width: 100%; 
    align-items: center; 
    text-align: center; 
  }
  .slide-bg { width: 100%; right: 0; border-radius: 0; opacity: 0.4; }
  .hero-slider { background: #000 !important; } /* Fallback background to contrast text */
  .hero-title { font-size: clamp(2rem, 8vw, 2.8rem) !important; color: #fff !important; }
  .hero-subtitle { font-size: 1rem !important; color: #eee !important; }
  .hero-eyebrow { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
  .hero-actions { justify-content: center; width: 100%; }
}
@media (max-width: 425px) {
  .hero-title { font-size: 2.2rem !important; }
  .btn-primary, .btn-ghost { padding: 12px 24px !important; font-size: 0.85rem !important; width: 100%; text-align: center; }
  .hero-actions { flex-direction: column; gap: 10px; }
}

/* --- 4. Category Cards (Original Grid to Stack) --- */
/* The original category grid used grid-template-columns: repeat(5, 1fr) */
@media (max-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 425px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}

/* --- 5. Forms Constraints --- */
.auth-card, .checkout-summary, .customer-details-form {
  max-width: 100%;
  box-sizing: border-box;
}
.form-input, .checkout-input, input[type="text"], input[type="email"], input[type="password"], textarea {
  max-width: 100%;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .auth-page { flex-direction: column; padding: 20px; }
  .auth-image { display: none; }
  .cart-page { grid-template-columns: 1fr; padding: 20px; }
  .checkout-container { flex-direction: column-reverse; padding: 20px; gap: 20px; }
  .checkout-split { flex-direction: column; }
}

/* --- 6. Footer Column Stacking --- */
@media (max-width: 1024px) {
  .site-footer .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
}
@media (max-width: 768px) {
  .site-footer .footer-grid { grid-template-columns: 1fr; gap: 30px; text-align: center; }
  .footer-logo { justify-content: center; }
  .social-links { justify-content: center; }
  .footer-contact-list li { justify-content: center; }
  .global-policy-strip .policy-items { flex-direction: column; gap: 20px; }
}

/* --- 7. Spacing and Padding Adjustments --- */
@media (max-width: 768px) {
  .category-section, .shivaay-collections, .why-section, .testimonials-section, .fresh-arrivals {
    padding: 50px 20px !important;
  }
  .collections-title, .section-title {
    font-size: clamp(1.8rem, 6vw, 2.2rem) !important;
  }
  .premium-features-bar .features-container {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  .feature-item-lux { width: calc(50% - 20px); justify-content: center; text-align: center; flex-direction: column; }
  .feature-item-lux .feature-info-lux { align-items: center; }
}
@media (max-width: 425px) {
  .feature-item-lux { width: 100%; }
}

/* Fix product grid specifically for mobile to prevent overflow */
.dynamic-product-grid, .products-grid {
  box-sizing: border-box;
  width: 100%;
}
@media (max-width: 425px) {
  .dynamic-product-grid { grid-template-columns: 1fr !important; }
  .products-grid { grid-template-columns: 1fr !important; }
}

/* Make sure mobile bottom nav doesn't cover content */
body {
  padding-bottom: 80px; /* Space for mobile-bottom-nav */
}
''')
