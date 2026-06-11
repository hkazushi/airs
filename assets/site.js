/* =========================================================
   AIRS — 関電工業風 モーション/インタラクション共通スクリプト
   無骨で洗練された動きに特化。不要なエフェクトを削除し、
   確実に動作するマスクアニメーションとフェードを実装。
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
    var revealSel = 'section h2, section h3, section h4, section p, section table, section form, section li, section blockquote, section .grid > *';
    var cssTargets = Array.prototype.slice.call(document.querySelectorAll(revealSel));

    // 親ごとに stagger(ずらし)を付与
    cssTargets.forEach(function (el) {
      var parent = el.parentNode;
      if (!parent || typeof parent.getAttribute !== 'function') return;
      var c = parseInt(parent.getAttribute('data-airs-c') || '0', 10);
      parent.setAttribute('data-airs-c', c + 1);
      var delay = Math.min(c * 100, 600); // 少しゆったりめに
      el.style.transitionDelay = delay + 'ms';
    });

    // テキスト要素のフェード
    var heroText = Array.prototype.slice.call(document.querySelectorAll('header h1, header p, header a, section h1'));
    var extra = [];
    heroText.forEach(function (el) { el.classList.add('reveal-js'); extra.push(el); });

    // 画像のマスクアニメーション構築
    var imgs = Array.prototype.slice.call(document.querySelectorAll('section img, footer img'));
    
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
      if (isHeroImg(img)) return; // ヒーロー背景は除外
      
      // 画像をラップしてマスクアニメーション用にする
      var wrapper = document.createElement('div');
      wrapper.className = 'airs-mask-wrap';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      
      extra.push(wrapper);
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
      }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
      all.forEach(function (el) { io.observe(el); });

      // フォールバック: 画面内にあるものは早めに表示
      window.addEventListener('load', function () {
        setTimeout(function () {
          all.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && !el.classList.contains('is-visible')) {
              el.classList.add('is-visible');
            }
          });
        }, 800);
      });
    }

    /* ---------- 2. ヒーロー背景のパララックス (Ken Burns) ---------- */
    if (!reduce) {
      var bgImgs = document.querySelectorAll('header img, section img');
      Array.prototype.forEach.call(bgImgs, function (img) {
        if (isHeroImg(img)) img.classList.add('airs-kenburns');
      });
    }

    /* ---------- 3. ギャラリー画像の hover ズーム (シンプル化) ---------- */
    var coverImgs = document.querySelectorAll('section img');
    Array.prototype.forEach.call(coverImgs, function (img) {
      var p = img.parentElement;
      if (!p || p.classList.contains('airs-mask-wrap')) return;
      var cls = (img.className || '');
      var isCover = /object-cover/.test(cls);
      var pcls = (p.className || '');
      var clipped = /overflow-hidden/.test(pcls) || /rounded/.test(pcls);
      if (isCover && clipped) {
        p.classList.add('airs-zoom');
      }
    });

    /* ---------- 4. ナビゲーションスクロール追従 ---------- */
    var nav = document.querySelector('nav.sticky') || document.querySelector('nav');
    function onScroll() {
      if (nav) {
        if (window.scrollY > 40) nav.classList.add('airs-scrolled');
        else nav.classList.remove('airs-scrolled');
      }
      if (topBtn) {
        if (window.scrollY > 400) topBtn.classList.add('show');
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

    /* ---------- 6. 大きな英字ウォーターマーク見出し ---------- */
    (function () {
      var wmObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); wmObserver.unobserve(e.target); } });
      }, { threshold: 0.1 }) : null;
      document.querySelectorAll('section').forEach(function (sec) {
        // 濃紺など暗い背景セクションは除外（アウトラインが映えないため）
        if (sec.className && /bg-deep-navy|bg-charcoal/.test(sec.className)) return;
        var eb = sec.querySelector('span.font-label-bold, span[class*="tracking-[0.2em]"]');
        if (!eb) return;
        var txt = (eb.textContent || '').trim();
        if (!txt || !/^[A-Za-z0-9 &\-]+$/.test(txt) || txt.length > 18) return;
        if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
        var wm = document.createElement('span');
        wm.className = 'airs-watermark';
        wm.textContent = txt;
        sec.insertBefore(wm, sec.firstChild);
        if (wmObserver) wmObserver.observe(wm); else wm.classList.add('is-visible');
      });
    })();

    /* ---------- 7. パララックス（大きめ画像がスクロールでゆっくり動く） ---------- */
    if (!reduce) {
      var pxImgs = [];
      document.querySelectorAll('.airs-mask-wrap > img').forEach(function (img) {
        var h = img.getBoundingClientRect().height;
        if (h >= 300 && !isHeroImg(img)) { img.classList.add('airs-parallax'); pxImgs.push(img); }
      });
      if (pxImgs.length) {
        var ticking = false;
        function parallax() {
          var vh = window.innerHeight;
          pxImgs.forEach(function (img) {
            var r = img.getBoundingClientRect();
            if (r.bottom < -100 || r.top > vh + 100) return;
            var center = r.top + r.height / 2;
            var off = ((center - vh / 2) / vh) * -28; // 最大±28px程度
            img.style.translate = '0 ' + off.toFixed(1) + 'px';
          });
          ticking = false;
        }
        window.addEventListener('scroll', function () {
          if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
        }, { passive: true });
        parallax();
      }
    }

    /* ---------- 8. 見出しの波ライン＋濃紺セクションのティール波トップ ---------- */
    (function () {
      var wave = '<svg viewBox="0 0 88 13" width="88" height="13" fill="none" aria-hidden="true"><path d="M2 8 Q 12 1 22 8 T 42 8 T 62 8 T 86 8" stroke="#1FB2A5" stroke-width="3" stroke-linecap="round"/></svg>';
      document.querySelectorAll('section h2, footer .font-headline-lg').forEach(function (h) {
        if (h.dataset.wu) return;
        h.dataset.wu = '1';
        var s = document.createElement('span');
        s.className = 'airs-wuline';
        s.innerHTML = wave;
        if (getComputedStyle(h).textAlign === 'center') s.style.margin = '16px auto 0';
        h.appendChild(s);
      });
      document.querySelectorAll('section[class*="bg-deep-navy"]').forEach(function (s) {
        s.classList.add('airs-wavetop');
      });
    })();

  });
})();
