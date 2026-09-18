(function () {
  'use strict';

  var customPagination = document.querySelector('meta[name="article-pagination"][content="custom"]');
  var hero = document.querySelector('.hero');
  var nav = document.querySelector('.nav, .pagenav');
  var count = document.querySelector('.count, .pagecount');
  var back = document.querySelector('.back, .back-link');
  var navInner = nav && nav.querySelector('.navin, .pagenav-inner');
  var mobileProgress = null;
  var mobileProgressTrack = null;
  var startX = 0;
  var startY = 0;
  var atBottom = false;
  var ignoreGesture = false;

  history.scrollRestoration = 'manual';

  if (navInner && count && window.matchMedia('(max-width: 600px)').matches) {
    mobileProgressTrack = document.createElement('div');
    mobileProgressTrack.className = 'mobile-page-progress';
    mobileProgressTrack.setAttribute('role', 'slider');
    mobileProgressTrack.setAttribute('aria-label', '文章閱讀進度');
    mobileProgressTrack.setAttribute('aria-valuemin', '1');
    mobileProgressTrack.setAttribute('tabindex', '0');
    mobileProgress = document.createElement('span');
    mobileProgress.className = 'mobile-page-progress-fill';
    mobileProgressTrack.appendChild(mobileProgress);
    navInner.insertBefore(mobileProgressTrack, count);
  }

  function updateProgress() {
    if (!mobileProgress || !count) return;
    var parts = count.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    if (!parts) return;
    mobileProgress.style.width = (Number(parts[1]) / Number(parts[2]) * 100) + '%';
    mobileProgressTrack.setAttribute('aria-valuemax', parts[2]);
    mobileProgressTrack.setAttribute('aria-valuenow', parts[1]);
    mobileProgressTrack.setAttribute('aria-valuetext', '第 ' + parts[1] + ' 頁，共 ' + parts[2] + ' 頁');
  }

  function goToProgress(clientX) {
    if (!mobileProgressTrack) return;
    var tabs = [].slice.call(document.querySelectorAll('.tab'));
    if (!tabs.length) return;
    var rect = mobileProgressTrack.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    var page = Math.round(ratio * (tabs.length - 1));
    tabs[page].click();
  }

  if (mobileProgressTrack) {
    var draggingProgress = false;
    mobileProgressTrack.addEventListener('pointerdown', function (event) {
      draggingProgress = true;
      mobileProgressTrack.setPointerCapture(event.pointerId);
      goToProgress(event.clientX);
      event.preventDefault();
    });
    mobileProgressTrack.addEventListener('pointermove', function (event) {
      if (!draggingProgress) return;
      goToProgress(event.clientX);
      event.preventDefault();
    });
    mobileProgressTrack.addEventListener('pointerup', function (event) {
      draggingProgress = false;
      if (mobileProgressTrack.hasPointerCapture(event.pointerId)) mobileProgressTrack.releasePointerCapture(event.pointerId);
    });
    mobileProgressTrack.addEventListener('pointercancel', function () { draggingProgress = false; });
    mobileProgressTrack.addEventListener('keydown', function (event) {
      var tabs = [].slice.call(document.querySelectorAll('.tab'));
      var active = tabs.findIndex(function (tab) { return tab.classList.contains('active'); });
      var target = active;
      if (event.key === 'ArrowLeft') target = Math.max(0, active - 1);
      else if (event.key === 'ArrowRight') target = Math.min(tabs.length - 1, active + 1);
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      tabs[target].click();
      event.preventDefault();
    });
  }

  function centerActiveTab() {
    var tabs = document.querySelector('.tabs');
    var active = tabs && tabs.querySelector('.tab.active');
    if (!tabs || !active || !tabs.clientWidth) return;
    var left = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
    tabs.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }

  if (nav) {
    var hint = nav.querySelector('.swipehint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'gesturehint';
      nav.appendChild(hint);
    }
    hint.textContent = '頁尾續滑換頁 · 拖進度條跳章 · 右滑回列表';
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
    new MutationObserver(function () {
      updateProgress();
      centerActiveTab();
      settleArticleTop();
    }).observe(count, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  updateProgress();
  centerActiveTab();

  function visibleNextButton() {
    return document.querySelector('.pagewrap:not([hidden]) [data-dir="1"], .page:not([hidden]) [data-dir="1"]');
  }

  document.addEventListener('touchstart', function (event) {
    if (event.touches.length !== 1) return;
    var touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
    ignoreGesture = !!event.target.closest('button, a, .tabs, .mobile-page-progress');
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
      if (dx > 0 && back && back.href) window.location.href = back.href;
      return;
    }

    if (!customPagination && atBottom && dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      var next = visibleNextButton();
      if (next && !next.disabled) next.click();
    }
  }, { passive: true });
})();
