/* =========================================================
   AIRS — モーション/インタラクション共通スクリプト
   依存なし(Vanilla JS)。スクロール出現・Ken Burns・hoverズーム・
   トップへ戻る・ナビ追従・スムーズスクロール。
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    /* ---------- 1. スクロール出現アニメ ---------- */
    var revealSel = 'section h2, section h3, section h4, section p, section table, section form, section li, section blockquote, section .grid > *, footer h2, footer h3, footer h4, footer p, footer li';
    var cssTargets = Array.prototype.slice.call(document.querySelectorAll(revealSel));

    // 親ごとに stagger(ずらし)を付与（data属性で兄弟インデックスを数える）
    cssTargets.forEach(function (el) {
      var c = parseInt(el.parentNode.getAttribute('data-airs-c') || '0', 10);
      el.parentNode.setAttribute('data-airs-c', c + 1);
      var delay = Math.min(c * 70, 420);
      el.style.transitionDelay = delay + 'ms';
    });

    // 画像とヒーローのテキストは個別に reveal-js を付与(背景カバー画像は除外)
    var heroText = Array.prototype.slice.call(document.querySelectorAll('header h1, header p, header a, section h1'));
    var imgs = Array.prototype.slice.call(document.querySelectorAll('section img, footer img'));
    var extra = [];
    heroText.forEach(function (el) { el.classList.add('reveal-js'); extra.push(el); });
    function isHeroImg(img) {
      var cls = img.className || '';
      var cover = /object-cover/.test(cls);
      var r = img.getBoundingClientRect();
      var parent = img.parentElement;
      var pcls = parent ? (parent.className || '') : '';
      var pos = getComputedStyle(img).position;
      var bgFill = (/absolute/.test(pcls) && /inset-0/.test(pcls)) || pos === 'absolute' || pos === 'fixed';
      return bgFill || (cover && r.height > window.innerHeight * 0.5);
    }
    imgs.forEach(function (img) {
      // 全面背景・ヒーロー画像はフェード対象外(Ken Burns側で扱う)
      if (isHeroImg(img)) return;
      img.classList.add('reveal-js');
      extra.push(img);
    });

    var all = cssTargets.concat(extra);

    if (reduce || !('IntersectionObserver' in window)) {
      all.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      all.forEach(function (el) { io.observe(el); });

      // 安全策: 読み込み後しばらくして未表示が残っていたら強制表示
      window.addEventListener('load', function () {
        setTimeout(function () {
          all.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && !el.classList.contains('is-visible')) {
              el.classList.add('is-visible');
            }
          });
        }, 1400);
      });
    }

    /* ---------- 2. ヒーロー背景の Ken Burns ---------- */
    if (!reduce) {
      var bgImgs = document.querySelectorAll('header img, section img');
      Array.prototype.forEach.call(bgImgs, function (img) {
        if (isHeroImg(img)) img.classList.add('airs-kenburns');
      });
    }

    /* ---------- 3. ギャラリー/カード画像の hover ズーム ---------- */
    var coverImgs = document.querySelectorAll('section img');
    Array.prototype.forEach.call(coverImgs, function (img) {
      var p = img.parentElement;
      if (!p) return;
      var cls = (img.className || '');
      // object-cover の画像で、親が overflow-hidden もしくは rounded のものをズーム対象に
      var isCover = /object-cover/.test(cls);
      var pcls = (p.className || '');
      var clipped = /overflow-hidden/.test(pcls) || /rounded/.test(pcls);
      var posAbs = getComputedStyle(img).position === 'absolute';
      if (isCover && clipped && !posAbs) {
        p.classList.add('airs-zoom');
      }
    });

    /* ---------- 4. ナビ: スクロール追従 ---------- */
    var nav = document.querySelector('nav.sticky') || document.querySelector('nav');
    function onScroll() {
      if (nav) {
        if (window.scrollY > 24) nav.classList.add('airs-scrolled');
        else nav.classList.remove('airs-scrolled');
      }
      // トップへ戻る表示
      if (topBtn) {
        if (window.scrollY > 320) topBtn.classList.add('show');
        else topBtn.classList.remove('show');
      }
    }

    /* ---------- 5. トップへ戻るボタン ---------- */
    var topBtn = document.createElement('button');
    topBtn.id = 'airsTop';
    topBtn.setAttribute('aria-label', 'ページ上部へ戻る');
    topBtn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(topBtn);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- 6. ページ内アンカーのスムーズスクロール ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id.length > 1) {
          var t = document.querySelector(id);
          if (t) {
            ev.preventDefault();
            t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          }
        }
      });
    });

  });
})();
