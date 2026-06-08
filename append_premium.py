with open('premium-redesign.css', 'a', encoding='utf-8') as f:
    f.write('''
/* ══════════ THE SHIVAAY COLLECTIONS ══════════ */
.shivaay-collections {
  padding: 100px 0;
  background: #ffffff;
}
.collections-header {
  text-align: center;
  margin-bottom: 60px;
}
.collections-title {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: var(--text-dark);
  text-transform: uppercase;
  letter-spacing: 2px;
  line-height: 1.2;
}
.collections-subtitle {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-top: 16px;
  letter-spacing: 1px;
}
.collections-masonry {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  grid-template-rows: 300px 300px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}
.collection-card {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  display: block;
}
.collection-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}
.collection-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.collection-card:hover .collection-img {
  transform: scale(1.05);
}
.collection-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%);
  transition: opacity 0.4s ease;
}
.collection-card:hover .collection-overlay {
  opacity: 0.9;
}
.collection-content {
  position: absolute;
  bottom: 30px;
  left: 30px;
  right: 30px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.collection-card-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  color: #fff;
  font-weight: 600;
  margin-bottom: 12px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.collection-card-title.gold-ivory {
  color: #fce7ef;
}
.collection-card-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f0e8e0;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.4s ease;
}
.collection-card:hover .collection-card-arrow {
  opacity: 1;
  transform: translateX(0);
}

.card-left {
  grid-column: 1;
  grid-row: 1 / 3;
}
.card-center-top {
  grid-column: 2;
  grid-row: 1;
}
.card-center-bottom {
  grid-column: 2;
  grid-row: 2;
}
.card-right {
  grid-column: 3;
  grid-row: 1 / 3;
}

.collections-small {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1400px;
  margin: 24px auto 0;
  padding: 0 24px;
}
.small-card {
  height: 220px;
}

@media (max-width: 1024px) {
  .collections-masonry {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }
  .card-left {
    grid-column: 1;
    grid-row: 1;
    height: 400px;
  }
  .card-right {
    grid-column: 2;
    grid-row: 1;
    height: 400px;
  }
  .card-center-top {
    grid-column: 1;
    grid-row: 2;
    height: 300px;
  }
  .card-center-bottom {
    grid-column: 2;
    grid-row: 2;
    height: 300px;
  }
  .collections-small {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 768px) {
  .collections-masonry {
    grid-template-columns: 1fr;
  }
  .card-left, .card-right, .card-center-top, .card-center-bottom {
    grid-column: 1;
    grid-row: auto;
    height: 350px;
  }
  .collections-small {
    grid-template-columns: 1fr;
  }
}
''')
