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

    /* ---------- 13. カーソル追従グロー ＋ クリック水紋 ＋ マグネット ---------- */
    var finePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
    if (!reduce && finePointer) {
      // --- 追従グロー ---
      var cur = document.createElement('div');
      cur.id = 'airsCursor';
      document.body.appendChild(cur);
      var cxTarget = -100, cyTarget = -100, cx = -100, cy = -100, shown = false;
      window.addEventListener('mousemove', function (e) {
        cxTarget = e.clientX; cyTarget = e.clientY;
        if (!shown) { cur.classList.add('airs-on'); shown = true; }
      }, { passive: true });
      window.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget) { cur.classList.remove('airs-on'); shown = false; }
      });
      function follow() {
        cx += (cxTarget - cx) * 0.18;
        cy += (cyTarget - cy) * 0.18;
        cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
        requestAnimationFrame(follow);
      }
      follow();
      // インタラクティブ要素で拡大＆色変化
      var hotSel = 'a, button, .airs-card, input, textarea, select, [role="button"]';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(hotSel)) cur.classList.add('airs-hot');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest(hotSel)) cur.classList.remove('airs-hot');
      });

      // --- クリック水紋（さざ波） ---
      window.addEventListener('pointerdown', function (e) {
        var n = 2; // 2重リング
        for (var j = 0; j < n; j++) {
          (function (delay, size) {
            var r = document.createElement('span');
            r.className = 'airs-ripple';
            r.style.left = e.clientX + 'px';
            r.style.top = e.clientY + 'px';
            r.style.width = size + 'px';
            r.style.height = size + 'px';
            r.style.animationDelay = delay + 'ms';
            document.body.appendChild(r);
            r.addEventListener('animationend', function () { r.remove(); });
            setTimeout(function () { if (r.parentNode) r.remove(); }, 1200);
          })(j * 110, 70 + j * 60);
        }
      }, { passive: true });

      // --- マグネットボタン（主要CTAがカーソルに吸い寄る） ---
      var magnets = document.querySelectorAll('.airs-shine');
      Array.prototype.forEach.call(magnets, function (btn) {
        btn.classList.add('airs-magnet');
        var rad = 90;
        btn.addEventListener('mousemove', function (e) {
          var b = btn.getBoundingClientRect();
          var dx = e.clientX - (b.left + b.width / 2);
          var dy = e.clientY - (b.top + b.height / 2);
          btn.style.transform = 'translate(' + (dx * 0.28) + 'px,' + (dy * 0.34) + 'px)';
        });
        btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
      });
    }

    /* ---------- 14. 3Dティルト（カード・画像がカーソルで傾く） ---------- */
    if (!reduce && finePointer) {
      var tiltEls = document.querySelectorAll('.airs-card, .airs-zoom');
      Array.prototype.forEach.call(tiltEls, function (el) {
        // カード内のギャラリー画像は二重ティルトを避けてスキップ
        if (el.classList.contains('airs-zoom') && el.closest('.airs-card')) return;
        el.classList.add('airs-tilt');
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(900px) rotateX(' + (-py * 7) + 'deg) rotateY(' + (px * 9) + 'deg) translateY(-6px) scale(1.02)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
    }

    /* ---------- 15. ギャラリー hover オーバーレイ ＋ ライトボックス ---------- */
    (function () {
      // ライトボックス本体（1つだけ生成）
      var lb = document.createElement('div');
      lb.id = 'airsLightbox';
      lb.innerHTML = '<span class="material-symbols-outlined airs-lb-close">close</span><img alt="拡大画像"/>';
      document.body.appendChild(lb);
      var lbImg = lb.querySelector('img');
      function openLB(src, alt) {
        lbImg.src = src; lbImg.alt = alt || '拡大画像';
        lb.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
      function closeLB() {
        lb.classList.remove('show');
        document.body.style.overflow = '';
      }
      lb.addEventListener('click', closeLB);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLB(); });

      // 各ギャラリー画像にオーバーレイ＆クリック拡大を付与
      document.querySelectorAll('.airs-zoom').forEach(function (box) {
        var img = box.querySelector('img');
        if (!img) return;
        // オーバーレイ（拡大アイコン）
        if (!box.querySelector('.airs-ov')) {
          var ov = document.createElement('div');
          ov.className = 'airs-ov';
          ov.innerHTML = '<span class="airs-ovbtn"><span class="material-symbols-outlined">zoom_in</span></span>';
          box.appendChild(ov);
        }
        // リンク内画像はリンク遷移を優先（ライトボックスにしない）
        if (box.closest('a')) { box.style.cursor = ''; return; }
        box.addEventListener('click', function () { openLB(img.currentSrc || img.src, img.alt); });
      });
    })();

    /* ---------- 16. 見出しに波アンダーライン（サーフ看板風） ---------- */
    (function () {
      var wave = '<svg viewBox="0 0 80 12" width="80" height="12" fill="none" aria-hidden="true"><path d="M2 7 Q 12 1 22 7 T 42 7 T 62 7 T 78 7" stroke="#1FB2A5" stroke-width="3" stroke-linecap="round"/></svg>';
      document.querySelectorAll('section h2').forEach(function (h) {
        if (h.dataset.airsWuline) return;
        h.dataset.airsWuline = '1';
        var span = document.createElement('span');
        span.className = 'airs-wuline';
        span.innerHTML = wave;
        if (getComputedStyle(h).textAlign === 'center') span.style.margin = '14px auto 0';
        h.appendChild(span);
      });
    })();

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
