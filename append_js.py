with open('script.js', 'a', encoding='utf-8') as f:
    f.write('''
// ============ HERO SLIDER & CAROUSEL ============
function attachHomeSliderControls() {
  if (window._homeSliderBound) return;
  window._homeSliderBound = true;
  
  const slides = document.querySelectorAll('.hero-slider .slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  
  if (slides.length === 0) return;
  
  let currentSlide = 0;
  let slideInterval;
  let isAnimating = false;
  
  function goToSlide(index) {
    if (isAnimating) return;
    isAnimating = true;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    if (currentSlide >= slides.length) currentSlide = 0;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    // reset animation flag after CSS transition duration (800ms)
    setTimeout(() => { isAnimating = false; }, 800);
    resetInterval();
  }
  
  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlideFunc() { goToSlide(currentSlide - 1); }
  
  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }
  
  if (prevBtn) prevBtn.addEventListener('click', prevSlideFunc);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (currentSlide !== index) goToSlide(index);
    });
  });
  
  // Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;
  const sliderContainer = document.getElementById('heroSlider');
  
  if (sliderContainer) {
    sliderContainer.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    sliderContainer.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, {passive: true});
  }
  
  function handleSwipe() {
    const minSwipeDist = 50;
    if (touchEndX < touchStartX - minSwipeDist) nextSlide();
    if (touchEndX > touchStartX + minSwipeDist) prevSlideFunc();
  }
  
  resetInterval();
}

// Carousel Horizontal Scroll
function scrollCarousel(direction) {
  const container = document.getElementById('freshArrivalsScroll');
  if (container) {
    const cardWidth = container.querySelector('.product-card').offsetWidth + 24; // card width + gap
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  }
}

// Attach these when page loads
document.addEventListener('DOMContentLoaded', () => {
  attachHomeSliderControls();
});
''')
