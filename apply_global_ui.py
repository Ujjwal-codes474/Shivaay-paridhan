with open('premium-redesign.css', 'a', encoding='utf-8') as f:
    f.write('''

/* ════════════════════════════════════════════════════════════════
   GLOBAL UI LUXURY OVERRIDES (Consistency & Spacing)
   ════════════════════════════════════════════════════════════════ */

:root {
  /* Enforce global 24px border radius for all cards and containers */
  --radius: 24px;
  --radius-sm: 16px;
  
  /* Enforce soft luxury shadow system */
  --shadow-soft: 0 15px 40px rgba(0,0,0,0.04);
  --shadow-card: 0 15px 40px rgba(0,0,0,0.04);
  --shadow-hover: 0 25px 50px rgba(0,0,0,0.08);
}

/* --- Premium Buttons --- */
.btn, .btn-primary, .admin-submit-btn, .action-btn {
  border-radius: 999px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1) !important;
}

.btn:hover, .btn-primary:hover, .admin-submit-btn:hover, .action-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 12px 30px rgba(201,168,76,0.3) !important;
}

/* --- Premium Cards (Product & Admin) --- */
.product-card, .admin-card, .stat-card, .premium-contact-card, .auth-card {
  border-radius: var(--radius) !important;
  box-shadow: var(--shadow-card) !important;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1) !important;
  border: 1px solid rgba(201, 168, 76, 0.1) !important;
  background: #ffffff !important;
}

.product-card:hover, .admin-card:hover, .stat-card:hover, .premium-contact-card:hover {
  transform: translateY(-8px) !important;
  box-shadow: var(--shadow-hover) !important;
  border-color: rgba(201, 168, 76, 0.4) !important;
}

/* Ensure images within cards respect the radius */
.product-card img {
  border-radius: var(--radius) var(--radius) 0 0 !important;
}

/* --- Input Fields --- */
input[type="text"], input[type="email"], input[type="password"], input[type="number"], select, textarea {
  border-radius: 12px !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
  background: #fafafa !important;
  transition: all 0.3s ease !important;
}

input:focus, select:focus, textarea:focus {
  background: #ffffff !important;
  border-color: var(--gold) !important;
  box-shadow: 0 0 0 4px rgba(201,168,76,0.1) !important;
}

/* --- Admin Specific Overrides --- */
.admin-content {
  background: #fdfdfd !important;
}

.sidebar-header h2 {
  font-size: 1.4rem !important;
}

.stat-icon {
  background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05)) !important;
  color: var(--gold) !important;
  border: 1px solid rgba(201,168,76,0.2) !important;
}

.admin-form-container {
  box-shadow: var(--shadow-card) !important;
  border-radius: var(--radius) !important;
  border: 1px solid rgba(201, 168, 76, 0.1) !important;
}

.admin-section .section-header h1 {
  font-size: 2.2rem !important;
  margin-bottom: 30px !important;
  color: var(--black) !important;
}
''')
