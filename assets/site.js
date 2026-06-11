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
      // 濃紺セクションは斜めカット（関電工業風の作り込み）
      document.querySelectorAll('section[class*="bg-deep-navy"]').forEach(function (s) {
        s.classList.add('airs-diagonal');
      });
    })();

    /* ---------- 11. ヒーローの凝った登場演出 ---------- */
    (function () {
      var hero = document.querySelector('header.relative, header[class*="h-["]') || document.querySelector('header');
      if (!hero) return;
      var h1 = hero.querySelector('h1');
      var lead = hero.querySelector('p');
      var ctas = hero.querySelectorAll('a');
      // 既存のreveal-jsを外して専用演出に
      [h1, lead].forEach(function (el) { if (el) el.classList.remove('reveal-js'); });
      ctas.forEach(function (a) { a.classList.remove('reveal-js'); });
      if (h1) {
        var parts = h1.innerHTML.split(/<br\s*\/?>/i);
        h1.innerHTML = parts.map(function (p) { return '<span class="airs-hero-mask"><span>' + p + '</span></span>'; }).join('');
      }
      if (lead) lead.classList.add('airs-hero-fade', 'd1');
      // CTAボタンの親をまとめてフェード
      if (ctas.length) {
        var ctaWrap = ctas[0].parentElement;
        if (ctaWrap) ctaWrap.classList.add('airs-hero-fade', 'd2');
      }
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('airs-hero-in'); }); });
    })();

    /* ---------- 12. Before / After スライダー（スクロール連動＋ドラッグ） ---------- */
    document.querySelectorAll('.airs-ba').forEach(function (ba) {
      var userActive = false;     // ユーザー操作中はスクロール連動を一時停止
      var idleTimer = null;
      function setPos(pct) { ba.style.setProperty('--airs-ba', Math.max(2, Math.min(98, pct)) + '%'); }
      function fromX(clientX) { var r = ba.getBoundingClientRect(); return ((clientX - r.left) / r.width) * 100; }
      function markUser() {
        userActive = true;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function () { userActive = false; }, 2500); // 操作後しばらくでスクロール連動に戻す
      }
      // ドラッグ操作
      var dragging = false;
      ba.addEventListener('pointerdown', function (e) { dragging = true; markUser(); setPos(fromX(e.clientX)); });
      window.addEventListener('pointermove', function (e) { if (dragging) { markUser(); setPos(fromX(e.clientX)); } });
      window.addEventListener('pointerup', function () { dragging = false; });

      // スクロール連動：セクションがビューポートを通過する進捗で 12%→88% にスイープ
      function onScrollBA() {
        if (userActive || dragging) return;
        var r = ba.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (vh - r.top) / (vh + r.height);   // 0(入る前)→1(抜けた後)
        progress = Math.max(0, Math.min(1, progress));
        // 下にスクロールするほど After(右) の幅が広がる（仕切りが左へ）
        setPos(88 - progress * 76);
      }
      window.addEventListener('scroll', onScrollBA, { passive: true });
      onScrollBA();
    });

    /* ---------- 9. カーソル連動（追従リング／マグネット／クリック水紋） ---------- */
    var finePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
    if (!reduce && finePointer) {
      // 追従リング
      var cur = document.createElement('div');
      cur.id = 'airsCursor';
      document.body.appendChild(cur);
      var ctx2 = { tx: -100, ty: -100, x: -100, y: -100, shown: false };
      window.addEventListener('mousemove', function (e) {
        ctx2.tx = e.clientX; ctx2.ty = e.clientY;
        if (!ctx2.shown) { cur.classList.add('airs-on'); ctx2.shown = true; }
      }, { passive: true });
      window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { cur.classList.remove('airs-on'); ctx2.shown = false; } });
      (function follow() {
        ctx2.x += (ctx2.tx - ctx2.x) * 0.18;
        ctx2.y += (ctx2.ty - ctx2.y) * 0.18;
        cur.style.transform = 'translate(' + ctx2.x + 'px,' + ctx2.y + 'px)';
        requestAnimationFrame(follow);
      })();
      var hotSel = 'a, button, .airs-zoom, .airs-card, input, textarea, select, [role="button"]';
      document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest(hotSel)) cur.classList.add('airs-hot'); });
      document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest(hotSel)) cur.classList.remove('airs-hot'); });

      // クリック水紋
      window.addEventListener('pointerdown', function (e) {
        for (var j = 0; j < 2; j++) {
          (function (delay, size) {
            var r = document.createElement('span');
            r.className = 'airs-ripple';
            r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
            r.style.width = size + 'px'; r.style.height = size + 'px';
            r.style.animationDelay = delay + 'ms';
            document.body.appendChild(r);
            setTimeout(function () { if (r.parentNode) r.remove(); }, 1100);
          })(j * 110, 70 + j * 60);
        }
      }, { passive: true });

      // マグネットボタン（主要CTA）
      document.querySelectorAll('a[class*="bg-ocean-blue"], a[class*="bg-deep-navy"], button[class*="bg-ocean-blue"]').forEach(function (btn) {
        btn.classList.add('airs-magnet');
        btn.addEventListener('mousemove', function (e) {
          var b = btn.getBoundingClientRect();
          var dx = e.clientX - (b.left + b.width / 2);
          var dy = e.clientY - (b.top + b.height / 2);
          btn.style.transform = 'translate(' + (dx * 0.25) + 'px,' + (dy * 0.3) + 'px)';
        });
        btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
      });
    }

    /* ---------- 10. カーソルに反応する風（流れ場で揃って流れる空気） ---------- */
    if (!reduce && finePointer && 'requestAnimationFrame' in window) {
      var cv = document.createElement('canvas');
      cv.id = 'airsWind';
      document.body.appendChild(cv);
      var wctx = cv.getContext('2d');
      var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
      function wresize() { W = cv.width = Math.floor(innerWidth * DPR); H = cv.height = Math.floor(innerHeight * DPR); cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; }
      wresize(); window.addEventListener('resize', wresize);
      var N = Math.max(70, Math.min(130, Math.round(innerWidth / 11))), ps = [];
      function spawn(edge) {
        var x = edge ? -40 * DPR : Math.random() * W;
        var y = Math.random() * H;
        return {
          x: x, y: y,
          sp: (1.0 + Math.random() * 1.4) * DPR,        // 右方向の基本風速
          a: 0.05 + Math.random() * 0.09,               // 線の濃さ（さらに薄め）
          w: (1.2 + Math.random() * 1.4) * DPR,         // 線の太さ
          maxT: 12 + (Math.random() * 12 | 0),          // 軌跡の長さ
          trail: [{ x: x, y: y }]
        };
      }
      for (var wi = 0; wi < N; wi++) ps.push(spawn(false));
      var mx = -99999, my = -99999, R = 175 * DPR;
      window.addEventListener('mousemove', function (e) { mx = e.clientX * DPR; my = e.clientY * DPR; }, { passive: true });
      window.addEventListener('mouseout', function () { mx = -99999; my = -99999; });
      var wt = 0;
      // 流れ場：位置で決まる縦方向の流れ（隣り合う線が揃って流れ、収束/発散する）
      function flowVY(x, y, t) {
        return (Math.sin(x * 0.0016 + y * 0.0030 + t * 0.45) + 0.5 * Math.sin(y * 0.0042 - t * 0.30)) * 1.7 * DPR;
      }
      (function wtick() {
        wt += 0.016;
        // 砂色の地を描いて背景レイヤー化（風はこの上に流れる）
        wctx.fillStyle = '#f5f1e8';
        wctx.fillRect(0, 0, W, H);
        wctx.lineCap = 'round'; wctx.lineJoin = 'round';
        for (var k = 0; k < ps.length; k++) {
          var p = ps[k];
          var vy = flowVY(p.x, p.y, wt);
          p.x += p.sp; p.y += vy;
          // カーソル付近で風が巻き上がる（ふわっと押し出し＋加速）
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = 1 - d / R; p.x += (dx / d) * f * 3.6 * DPR + f * 5 * DPR; p.y += (dy / d) * f * 3.6 * DPR; }
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > p.maxT) p.trail.shift();
          // 画面外で左から再生成
          if (p.x > W + 50 * DPR || p.y < -60 * DPR || p.y > H + 60 * DPR) { ps[k] = spawn(true); continue; }
          // 軌跡をなめらかな線で描画（風の筋）
          var tr = p.trail;
          wctx.strokeStyle = 'rgba(31,178,165,' + p.a + ')';
          wctx.lineWidth = p.w;
          wctx.beginPath();
          wctx.moveTo(tr[0].x, tr[0].y);
          for (var i = 1; i < tr.length; i++) wctx.lineTo(tr[i].x, tr[i].y);
          wctx.stroke();
        }
        requestAnimationFrame(wtick);
      })();
    }

  });
})();
