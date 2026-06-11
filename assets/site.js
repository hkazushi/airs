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
    var revealSel = 'section h2, section h3, section h4, section p, section table, section form, section li, section blockquote, section .grid > *';
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

    /* ---------- 12. カーソルに反応する「そよ風」Canvasアニメーション ---------- */
    if (!reduce && 'requestAnimationFrame' in window) {
      var cv = document.createElement('canvas');
      cv.id = 'airsWind';
      cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;opacity:.85';
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

      // 風要素のリスト (流線とパーティクル)
      var windElements = [];
      var lastMouseX = null;
      var lastMouseY = null;
      var lastTime = Date.now();

      // マウス移動イベントから繊細な光の粒子と極細流線を生成
      window.addEventListener('mousemove', function (e) {
        var mx = e.clientX * DPR;
        var my = e.clientY * DPR;
        var now = Date.now();
        var dt = now - lastTime;

        if (dt > 8 && lastMouseX !== null) {
          var dx = mx - lastMouseX;
          var dy = my - lastMouseY;
          var speed = Math.sqrt(dx * dx + dy * dy);

          if (speed > 1.5) {
            var angle = Math.atan2(dy, dx);
            var numParticles = Math.min(3, Math.ceil(speed / 8));
            for (var i = 0; i < numParticles; i++) {
              var ratio = i / numParticles;
              var rx = lastMouseX + dx * ratio;
              var ry = lastMouseY + dy * ratio;

              // 1. きらきら光る極微細な風粒子（パーティクル）
              windElements.push({
                type: 'particle',
                x: rx,
                y: ry,
                vx: Math.cos(angle + (Math.random() - 0.5) * 0.4) * (1 + Math.random() * 2) * DPR + (1.2 * DPR), // 右へ流れる風
                vy: Math.sin(angle + (Math.random() - 0.5) * 0.4) * (0.8 + Math.random() * 1.5) * DPR,
                size: (0.8 + Math.random() * 1.6) * DPR,
                alpha: 0.4 + Math.random() * 0.5,
                decay: 0.008 + Math.random() * 0.015,
                phase: Math.random() * Math.PI * 2,
                speedPhase: 0.05 + Math.random() * 0.05,
                color: Math.random() > 0.4 ? 'rgba(255,255,255,' : 'rgba(120,230,245,' // 白か淡いティール色
              });

              // 2. 超極細のしなやかな風の糸（流線）
              if (Math.random() < 0.28) {
                windElements.push({
                  type: 'line',
                  x: rx,
                  y: ry,
                  vx: (1.5 + Math.random() * 2.5) * DPR,
                  vy: (Math.random() - 0.5) * 0.6 * DPR,
                  length: (30 + Math.random() * 60) * DPR,
                  width: (0.5 + Math.random() * 0.5) * DPR, // 極細
                  alpha: 0.12 + Math.random() * 0.15,
                  decay: 0.006 + Math.random() * 0.01,
                  phase: Math.random() * Math.PI * 2,
                  amplitude: (1.5 + Math.random() * 3.5) * DPR
                });
              }
            }
          }
        }
        lastMouseX = mx;
        lastMouseY = my;
        lastTime = now;
      }, { passive: true });

      // 自然な背景のそよ風（マウス無動時も静かに画面を流れる）
      setInterval(function() {
        if (windElements.length < 80 && Math.random() < 0.35) {
          var ry = Math.random() * H;
          // 左端から流れる極細流線
          windElements.push({
            type: 'line',
            x: -100 * DPR,
            y: ry,
            vx: (1.2 + Math.random() * 2) * DPR,
            vy: (Math.random() - 0.5) * 0.4 * DPR,
            length: (60 + Math.random() * 90) * DPR,
            width: (0.4 + Math.random() * 0.4) * DPR,
            alpha: 0.08 + Math.random() * 0.12,
            decay: 0.002 + Math.random() * 0.004,
            phase: Math.random() * Math.PI * 2,
            amplitude: (3 + Math.random() * 7) * DPR
          });
          
          if (Math.random() < 0.5) {
            windElements.push({
              type: 'particle',
              x: -30 * DPR,
              y: ry + (Math.random() - 0.5) * 50 * DPR,
              vx: (1.5 + Math.random() * 2) * DPR,
              vy: (Math.random() - 0.5) * 0.8 * DPR,
              size: (0.6 + Math.random() * 1.2) * DPR,
              alpha: 0.18 + Math.random() * 0.22,
              decay: 0.002 + Math.random() * 0.004,
              phase: Math.random() * Math.PI * 2,
              speedPhase: 0.02 + Math.random() * 0.03,
              color: 'rgba(255,255,255,'
            });
          }
        }
      }, 180);

      function tick() {
        ctx.clearRect(0, 0, W, H);
        
        for (var i = windElements.length - 1; i >= 0; i--) {
          var w = windElements[i];
          w.alpha -= w.decay;
          
          if (w.alpha <= 0 || w.x - (w.length || 0) > W) {
            windElements.splice(i, 1);
            continue;
          }

          if (w.type === 'particle') {
            w.phase += w.speedPhase;
            w.x += w.vx;
            w.y += w.vy + Math.sin(w.phase) * (w.size * 0.12);
            
            ctx.fillStyle = w.color + w.alpha + ')';
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (w.type === 'line') {
            w.phase += 0.025;
            w.x += w.vx;
            w.y += w.vy + Math.sin(w.phase) * (w.amplitude * 0.04);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + w.alpha + ')';
            ctx.lineWidth = w.width;
            ctx.beginPath();
            ctx.moveTo(w.x, w.y);
            ctx.quadraticCurveTo(
              w.x - w.length * 0.5, 
              w.y - Math.sin(w.phase) * w.amplitude, 
              w.x - w.length, 
              w.y
            );
            ctx.stroke();
          }
        }
        requestAnimationFrame(tick);
      }
      tick();
    }
    /* ---------- 19. 見出しの背後に英語の超巨大背景アウトライン文字を動的挿入 ---------- */
    (function () {
      document.querySelectorAll('section h2').forEach(function (h) {
        var prev = h.previousElementSibling;
        var text = '';
        if (prev && (prev.tagName === 'SPAN' || prev.classList.contains('font-label-bold'))) {
          text = (prev.textContent || prev.innerText).trim();
        }
        if (!text) {
          var hText = (h.textContent || h.innerText).trim();
          if (hText.indexOf('事業内容') !== -1) text = 'SERVICES';
          else if (hText.indexOf('施工事例') !== -1) text = 'WORKS';
          else if (hText.indexOf('流れ') !== -1) text = 'FLOW';
          else if (hText.indexOf('お知らせ') !== -1) text = 'NEWS';
        }
        
        if (text) {
          var bgTxt = document.createElement('div');
          bgTxt.className = 'airs-bg-title';
          bgTxt.innerText = text;
          h.style.position = 'relative';
          h.insertBefore(bgTxt, h.firstChild);
        }
      });
    })();

    /* ---------- 18. パララックススクロール効果 ---------- */
    if (!reduce && 'IntersectionObserver' in window) {
      var pBgs = document.querySelectorAll('.parallax-bg');
      window.addEventListener('scroll', function () {
        var sy = window.scrollY;
        Array.prototype.forEach.call(pBgs, function (bg) {
          var parent = bg.parentElement;
          if (!parent) return;
          var rect = parent.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            // 親要素のスクロール位置に対する相対的なズレを計算してパララックスさせる
            var offset = sy - parent.offsetTop;
            bg.style.transform = 'translate3d(0, ' + (offset * 0.32) + 'px, 0)';
          }
        });
      }, { passive: true });
    }

  });
})();
