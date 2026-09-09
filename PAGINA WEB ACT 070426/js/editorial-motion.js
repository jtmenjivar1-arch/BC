'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.06});
    window.bcObserveReveals = () => {
      document.querySelectorAll('.section-head,.how-card,.special-card,.shirt-card,.box-selector-row,.search-panel,.footer-layout,.footer-bottom').forEach(node => {
        if (node.dataset.revealObserved) return;
        node.dataset.revealObserved = 'true';
        node.classList.add('reveal-item','reveal-pending');
        observer.observe(node);
      });
    };
    window.bcObserveReveals();
  }
  const slides = document.querySelector('.hero-slides');
  let touchStart = null;
  slides?.addEventListener('touchstart', e => {
    const t=e.touches[0]; touchStart={x:t.clientX,y:t.clientY};
  }, {passive:true});
  slides?.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
    if (Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.6) document.getElementById(dx<0?'heroNext':'heroPrev')?.click();
    touchStart=null;
  }, {passive:true});
  slides?.addEventListener('touchcancel', () => {touchStart=null;}, {passive:true});
});
