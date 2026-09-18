(function () {
  'use strict';

  var customPagination = document.querySelector('meta[name="article-pagination"][content="custom"]');
  var hero = document.querySelector('.hero');
  var nav = document.querySelector('.nav, .pagenav');
  var count = document.querySelector('.count, .pagecount');
  var back = document.querySelector('.back, .back-link');
  var startX = 0;
  var startY = 0;
  var atBottom = false;
  var ignoreGesture = false;

  history.scrollRestoration = 'manual';

  if (nav) {
    var hint = nav.querySelector('.swipehint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'gesturehint';
      nav.appendChild(hint);
    }
    hint.textContent = '頁尾繼續往下換頁 · 往左滑回文章列表';
  }

  function articleTop() {
    if (!hero) return;
    window.scrollTo(0, hero.offsetTop + hero.offsetHeight);
  }

  function settleArticleTop() {
    articleTop();
    setTimeout(articleTop, 100);
    setTimeout(articleTop, 300);
    setTimeout(articleTop, 600);
  }

  if (count && hero) {
    new MutationObserver(settleArticleTop).observe(count, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function visibleNextButton() {
    return document.querySelector('.pagewrap:not([hidden]) [data-dir="1"], .page:not([hidden]) [data-dir="1"]');
  }

  document.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1) return;
    var touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
    ignoreGesture = !!event.target.closest('button, a, .tabs');
  }, { passive: true });

  document.addEventListener('touchmove', function (event) {
    if (customPagination || ignoreGesture || !atBottom || !event.touches.length) return;
    var touch = event.touches[0];
    var dy = touch.clientY - startY;
    var dx = touch.clientX - startX;
    if (dy < -10 && Math.abs(dy) > Math.abs(dx)) event.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', function (event) {
    if (ignoreGesture || !event.changedTouches.length) return;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;

    if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0 && back && back.href) window.location.href = back.href;
      return;
    }

    if (!customPagination && atBottom && dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      var next = visibleNextButton();
      if (next && !next.disabled) next.click();
    }
  }, { passive: true });
})();
