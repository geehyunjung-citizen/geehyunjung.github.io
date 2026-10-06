(() => {
  'use strict';

  // 헤더: 페이지 상단을 벗어나면 하단 경계선 표시
  const header = document.getElementById('header');
  const sentinel = document.querySelector('.scroll-sentinel');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting);
    }).observe(sentinel);
  }

  // 스크롤 리빌: 같은 묶음 안의 요소는 순서대로 조금씩 늦게 등장
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((child) => child.hasAttribute('data-reveal'));
      el.style.setProperty('--reveal-delay', `${siblings.indexOf(el) * 70}ms`);
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  // FAQ 아코디언: 한 번에 하나만 펼침
  const faqItems = [...document.querySelectorAll('.faq-item')];
  const setFaqOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq-q').setAttribute('aria-expanded', String(open));
  };
  faqItems.forEach((item) => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => setFaqOpen(other, false));
      setFaqOpen(item, willOpen);
    });
  });

  // GA4: 구간 도달 (section_view)
  // 제목이 화면에 50% 이상 들어올 때 이벤트 전송 (페이지 로드당 1회)
  if ('IntersectionObserver' in window && typeof gtag !== 'undefined') {
    const sectionTargets = [
      { elem: document.getElementById('hero-title'), name: 'hero' },
      { elem: document.getElementById('solution-title'), name: 'detail' },
      { elem: document.getElementById('final-title'), name: 'cta' },
    ].filter((s) => s.elem);

    const viewedSections = new Set();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewedSections.has(entry.target.id)) {
            const sectionName = sectionTargets.find((s) => s.elem === entry.target)?.name;
            if (sectionName) {
              viewedSections.add(entry.target.id);
              gtag('event', 'section_view', { section_name: sectionName });
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: `-${header?.offsetHeight || 60}px 0px 0px 0px` }
    );

    sectionTargets.forEach((s) => sectionObserver.observe(s.elem));
  }

  // GA4: CTA 클릭 측정 (cta_click)
  // 두 CTA 버튼 클릭 시 이벤트 전송 (링크는 기존대로 새 탭에서 열림)
  if (typeof gtag !== 'undefined') {
    const ctaButtons = [
      { elem: document.getElementById('cta-hero-button'), location: 'hero' },
      { elem: document.getElementById('cta-final-button'), location: 'final' },
    ].filter((c) => c.elem);

    ctaButtons.forEach((c) => {
      c.elem.addEventListener('click', () => {
        gtag('event', 'cta_click', { button_location: c.location });
      });
    });
  }

  // CTA: 쿠팡 파트너스 링크로 새 탭에서 이동한다 (index.html의 href).
  // 버튼은 id(#cta-hero-button, #cta-final-button)와 data-cta(hero, final)로 구분한다.

  // 상품 사진이 없거나 로드에 실패하면 '이미지 준비 중' 플레이스홀더 표시
  const markFailed = (img) => {
    const frame = img.closest('.media');
    img.style.display = 'none';
    if (frame) {
      frame.classList.add('is-failed');
      frame.setAttribute('role', 'img');
      frame.setAttribute('aria-label', `이미지 준비 중: ${img.alt}`);
    }
  };
  document.querySelectorAll('.media img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      markFailed(img);
    } else {
      img.addEventListener('error', () => markFailed(img), { once: true });
    }
  });
})();
