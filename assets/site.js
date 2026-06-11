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
      // クリップ＋ズームアウトのリッチ出現
      img.classList.add('airs-img-reveal');
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

    /* ---------- 7. スクロール進捗バー ---------- */
    var prog = document.createElement('div');
    prog.id = 'airsProgress';
    document.body.appendChild(prog);
    function updateProgress() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      prog.style.width = Math.min(100, (window.scrollY / max) * 100) + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    /* ---------- 8. ヒーローに夕陽グロー ---------- */
    if (!reduce) {
      var hero = document.querySelector('header.relative, header[class*="h-["], section[class*="h-screen"], section[class*="min-h"]');
      if (hero && !hero.querySelector('.airs-sun')) {
        var sun = document.createElement('div');
        sun.className = 'airs-sun';
        hero.appendChild(sun);
      }
    }

    /* ---------- 10. 主要ボタンの光沢スイープ ---------- */
    document.querySelectorAll('a, button').forEach(function (b) {
      var c = b.className || '';
      if (/bg-ocean-blue|bg-deep-navy|bg-coral/.test(c) && /rounded/.test(c) && /(px-|py-)/.test(c)) {
        b.classList.add('airs-shine');
      }
    });

    /* ---------- 11. カードの傾き＆浮き上がり ---------- */
    document.querySelectorAll('section .grid > *').forEach(function (card) {
      var c = card.className || '';
      if (/rounded/.test(c) && /(border|shadow|bg-white|bg-surface|backdrop-blur)/.test(c)) {
        card.classList.add('airs-card');
      }
    });

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

    /* ---------- 12. カーソルに反応する風エフェクト ---------- */
    if (!reduce && 'requestAnimationFrame' in window) {
      var cv = document.createElement('canvas');
      cv.id = 'airsWind';
      cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;opacity:.55';
      document.body.appendChild(cv);
      var ctx = cv.getContext('2d');
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0;
      function resize() {
        W = cv.width = Math.floor(window.innerWidth * DPR);
        H = cv.height = Math.floor(window.innerHeight * DPR);
        cv.style.width = window.innerWidth + 'px';
        cv.style.height = window.innerHeight + 'px';
      }
      resize();
      window.addEventListener('resize', resize);

      var N = Math.max(28, Math.min(54, Math.round(window.innerWidth / 26)));
      var ps = [];
      function spawn(fromLeft) {
        return {
          x: fromLeft ? -30 * DPR : Math.random() * W,
          y: Math.random() * H,
          len: (14 + Math.random() * 30) * DPR,
          sp: (0.5 + Math.random() * 1.5) * DPR,
          ph: Math.random() * Math.PI * 2,
          amp: (3 + Math.random() * 9) * DPR,
          a: 0.10 + Math.random() * 0.22
        };
      }
      for (var i = 0; i < N; i++) ps.push(spawn(false));

      var mx = -99999, my = -99999;
      window.addEventListener('mousemove', function (e) { mx = e.clientX * DPR; my = e.clientY * DPR; }, { passive: true });
      window.addEventListener('mouseout', function () { mx = -99999; my = -99999; });

      var t = 0, R = 170 * DPR;
      function tick() {
        t += 0.016;
        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = 'round';
        for (var k = 0; k < ps.length; k++) {
          var p = ps[k];
          var vy = Math.sin(t * 0.9 + p.ph) * p.amp * 0.08;
          p.x += p.sp;
          p.y += vy;
          // カーソル付近で“ふわっ”と押し出す（風のうねり）
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            var d = Math.sqrt(d2) || 1, f = 1 - d / R;
            p.x += (dx / d) * f * 3.4 * DPR + f * 4 * DPR;
            p.y += (dy / d) * f * 3.4 * DPR;
          }
          if (p.x - p.len > W) { ps[k] = spawn(true); continue; }
          ctx.strokeStyle = 'rgba(150,202,224,' + p.a + ')';
          ctx.lineWidth = 1.1 * DPR;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x - p.len * 0.5, p.y - vy * 7, p.x - p.len, p.y);
          ctx.stroke();
        }
        requestAnimationFrame(tick);
      }
      tick();
    }

  });
})();
