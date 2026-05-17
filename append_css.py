with open('main.css', 'a', encoding='utf-8') as f:
    f.write('''

/* ══════════ HERO SLIDER ══════════ */
.hero-slider {
  position: relative;
  min-height: 100vh;
  background: var(--black);
  overflow: hidden;
  display: flex;
  align-items: center;
}

.slider-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.slide.active {
  opacity: 1;
  z-index: 2;
}

.slide-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
}

.slide.active .slide-bg {
  animation: subtleZoom 10s ease-out forwards;
}

@keyframes subtleZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

.gold-texture-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent, rgba(20, 15, 5, 0.4)), url('data:image/svg+xml;utf8,<svg width="4" height="4" viewBox="0 0 4 4" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4" fill="none"/><path d="M0 0L4 4ZM4 0L0 4Z" stroke="rgba(201,168,76,0.1)" stroke-width="1"/></svg>');
  mix-blend-mode: overlay;
}

.hero-slider .hero-content {
  position: relative;
  z-index: 3;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 24px 60px;
  width: 100%;
  text-align: center;
}

.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--white);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(4px);
  transition: var(--transition);
}

.slider-btn:hover {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--black);
}

.prev-btn { left: 30px; }
.next-btn { right: 30px; }

.slider-dots {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.slider-dots .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: var(--transition);
}

.slider-dots .dot.active {
  background: var(--gold);
  transform: scale(1.3);
}

/* ══════════ DOODLES / LUXURY ELEMENTS ══════════ */
.doodle-bg {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}

.pattern-floral {
  background-image: url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C20 11 11 20 0 20C11 20 20 29 20 40C20 29 29 20 40 20C29 20 20 11 20 0Z" fill="%23c9a84c"/></svg>');
}

.doodle-corner {
  position: absolute;
  width: 150px;
  height: 150px;
  opacity: 0.1;
  pointer-events: none;
  z-index: 5;
  background-size: contain;
  background-repeat: no-repeat;
}

.top-left { top: 0; left: 0; }
.bottom-right { bottom: 0; right: 0; transform: rotate(180deg); }

.pattern-mandala {
  background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="0" cy="0" r="80" fill="none" stroke="%23c9a84c" stroke-width="2"/><circle cx="0" cy="0" r="60" fill="none" stroke="%23c9a84c" stroke-width="1" stroke-dasharray="5 5"/></svg>');
}

.pattern-handloom {
  background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0 100L100 0M20 100L100 20M40 100L100 40M60 100L100 60M80 100L100 80" stroke="%23c9a84c" stroke-width="1"/></svg>');
}

.doodle-divider {
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10Q15 0 30 10T60 10" fill="none" stroke="%23c9a84c" stroke-width="1"/></svg>');
  opacity: 0.3;
  margin: 40px 0;
}

/* ══════════ FRESH ARRIVALS (HORIZONTAL SCROLL) ══════════ */
.fresh-arrivals {
  position: relative;
  padding: 80px 0;
  background: var(--off-white);
  overflow: hidden;
}

.horizontal-scroll-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 40px;
}

.horizontal-scroll-container {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  padding: 20px 5px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.horizontal-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.horizontal-scroll-container .product-card {
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--white);
  border: 1px solid #ddd;
  color: var(--black);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 10;
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}

.scroll-btn:hover {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--white);
}

.scroll-btn.prev-btn { left: -22px; }
.scroll-btn.next-btn { right: -22px; }

@media (max-width: 768px) {
  .scroll-btn { display: none; }
  .horizontal-scroll-container .product-card {
    min-width: 240px;
  }
}
''')
