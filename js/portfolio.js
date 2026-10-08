/* ==========================================================================
   Majd Safira — Portfolio interactions
   ========================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;
    var body = document.body;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    root.classList.add('js');

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------- Preloader ---------- */
    function hidePreloader() {
        var pre = $('#preloader');
        if (!pre || pre.classList.contains('is-done')) return;
        pre.classList.add('is-done');
        body.classList.add('is-loaded');
        revealHero();
    }

    // The script is deferred, so the DOM is ready here; don't wait for slow CDN fonts/icons.
    setTimeout(hidePreloader, 700);

    /* ---------- Theme toggle ---------- */
    var themeBtn = $('#themeToggle');

    function syncThemeIcon() {
        if (!themeBtn) return;
        var dark = root.getAttribute('data-theme') !== 'light';
        themeBtn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        var meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#0a0e1a' : '#f4f6fc');
    }

    if (themeBtn) {
        syncThemeIcon();
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('ms-theme', next); } catch (e) {}
            syncThemeIcon();
        });
    }

    /* ---------- Mobile navigation ---------- */
    var burger = $('#burger');
    var navLinks = $('#navLinks');

    function setMenu(open) {
        if (!burger || !navLinks) return;
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        navLinks.classList.toggle('is-open', open);
    }

    if (burger) {
        burger.addEventListener('click', function () {
            setMenu(burger.getAttribute('aria-expanded') !== 'true');
        });
    }

    $$('#navLinks a, #navLinks button').forEach(function (el) {
        el.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('click', function (e) {
        if (navLinks && navLinks.classList.contains('is-open') && !navLinks.contains(e.target) && !burger.contains(e.target)) {
            setMenu(false);
        }
    });

    /* ---------- Scroll: nav state, progress bar, timeline fill ---------- */
    var nav = $('#nav');
    var progress = $('#scrollProgress');
    var timeline = $('.timeline');
    var timelineFill = $('#timelineFill');
    var photoTilt = finePointer ? null : $('.photo-wrap'); // touch: tilt the photo as you scroll
    var ticking = false;

    function onScroll() {
        var y = window.scrollY || window.pageYOffset;
        var max = document.documentElement.scrollHeight - window.innerHeight;

        if (nav) nav.classList.toggle('is-scrolled', y > 20);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

        if (timeline && timelineFill) {
            var r = timeline.getBoundingClientRect();
            var start = window.innerHeight * 0.75;
            var pct = Math.min(1, Math.max(0, (start - r.top) / r.height));
            timelineFill.style.transform = 'scaleY(' + pct + ')';
        }

        if (photoTilt) {
            var t = Math.min(1, y / (window.innerHeight * 0.8));
            photoTilt.style.transform = 'perspective(900px) rotateX(' + (t * 14) + 'deg) rotateY('
                + (Math.sin(y / 160) * 6) + 'deg) scale(' + (1 - t * 0.08) + ')';
        }

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- Active nav link ---------- */
    var navMap = {};
    $$('[data-nav]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });

    if ('IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                $$('[data-nav]').forEach(function (a) { a.classList.remove('is-active'); });
                var link = navMap[entry.target.id];
                if (link) link.classList.add('is-active');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        $$('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
    }

    /* ---------- Reveal on scroll ---------- */
    var heroReveals = $$('.hero .reveal');

    // Once the entrance has played, .is-done swaps the slow, delayed reveal
    // transition for a quick one so hover/tap effects respond instantly.
    function show(el) {
        el.classList.add('is-visible');
        var delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
        setTimeout(function () { el.classList.add('is-done'); }, 950 + delay * 1000);
    }

    function revealHero() {
        heroReveals.forEach(show);
    }

    var reveals = $$('.reveal').filter(function (el) { return heroReveals.indexOf(el) === -1; });

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                show(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        reveals.forEach(function (el) { revealObserver.observe(el); });
    } else {
        reveals.forEach(show);
        revealHero();
    }

    /* ---------- Counters ---------- */
    function animateCount(el) {
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

        var duration = 1600;
        var startTime = null;

        function step(ts) {
            if (!startTime) startTime = ts;
            var t = Math.min(1, (ts - startTime) / duration);
            var eased = 1 - Math.pow(1 - t, 4);
            el.textContent = (target * eased).toFixed(decimals);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    var counters = $$('[data-count]');
    if ('IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animateCount(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { countObserver.observe(el); });
    } else {
        counters.forEach(animateCount);
    }

    /* ---------- Typing effect ---------- */
    var typedEl = $('#typed');
    if (typedEl) {
        var words = [];
        try { words = JSON.parse(typedEl.getAttribute('data-words') || '[]'); } catch (e) {}

        if (words.length) {
            var wi = 0, ci = 0, deleting = false;
            typedEl.textContent = '';

            (function type() {
                var word = words[wi];
                ci += deleting ? -1 : 1;
                typedEl.textContent = word.slice(0, ci);

                var delay = deleting ? 40 : 85;
                if (!deleting && ci === word.length) { delay = 1800; deleting = true; }
                else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }

                setTimeout(type, delay);
            })();
        }
    }

    /* ---------- 3D tilt + spotlight ---------- */
    // Inline transitions override the slow, delayed .reveal transition while hovering.
    var HOVER_TRANSITION = 'transform .15s ease-out, border-color .3s, box-shadow .3s, background-color .3s';
    var LEAVE_TRANSITION = 'transform .6s cubic-bezier(.22,1,.36,1), border-color .3s, box-shadow .3s, background-color .3s';

    if (finePointer) {
        $$('[data-tilt]').forEach(function (el) {
            var max = el.classList.contains('photo-wrap') ? 10 : 6;

            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width;
                var py = (e.clientY - r.top) / r.height;
                el.style.transition = HOVER_TRANSITION;
                el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * max) + 'deg) rotateY(' + ((px - 0.5) * max) + 'deg)';
                el.style.setProperty('--mx', (px * 100) + '%');
                el.style.setProperty('--my', (py * 100) + '%');
            });

            el.addEventListener('mouseleave', function () {
                el.style.transition = LEAVE_TRANSITION;
                el.style.transform = '';
            });
        });

        /* magnetic buttons */
        $$('.magnetic').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var r = btn.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2;
                var y = e.clientY - r.top - r.height / 2;
                btn.style.transition = HOVER_TRANSITION;
                btn.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.28 + 'px)';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transition = LEAVE_TRANSITION;
                btn.style.transform = '';
            });
        });

        /* cursor glow */
        var glow = $('#cursorGlow');
        if (glow) {
            var gx = 0, gy = 0, tx = 0, ty = 0, running = false;
            var follow = function () {
                gx += (tx - gx) * 0.12;
                gy += (ty - gy) * 0.12;
                glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
                if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) requestAnimationFrame(follow);
                else running = false;
            };
            window.addEventListener('mousemove', function (e) {
                tx = e.clientX; ty = e.clientY;
                glow.classList.add('is-active');
                if (!running) { running = true; requestAnimationFrame(follow); }
            }, { passive: true });
            document.addEventListener('mouseleave', function () { glow.classList.remove('is-active'); });
        }
    }

    /* ---------- Touch devices: tap feedback ---------- */
    if (!finePointer) {
        root.classList.add('touch');

        var PRESSABLE = '[data-tilt]:not(.photo-wrap), .skill-list li, .duty, .contact-card, .chip, .btn, .socials a';

        document.addEventListener('pointerdown', function (e) {
            var el = e.target.closest && e.target.closest(PRESSABLE);
            if (!el) return;

            var r = el.getBoundingClientRect();
            el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
            el.classList.add('is-pressed');

            var release = function () {
                setTimeout(function () { el.classList.remove('is-pressed'); }, 160);
                document.removeEventListener('pointerup', release);
                document.removeEventListener('pointercancel', release);
            };
            document.addEventListener('pointerup', release);
            document.addEventListener('pointercancel', release);
        }, { passive: true });
    }

    /* ---------- Particle network background ---------- */
    var canvas = $('#bg-canvas');
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var particles = [];
        var mouse = { x: -9999, y: -9999 };
        var w, h, rgb;

        var readColor = function () {
            rgb = getComputedStyle(root).getPropertyValue('--particle').trim() || '160,170,255';
        };

        var resize = function () {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            var count = Math.round(Math.max(32, Math.min(90, (w * h) / 16000)));
            var speed = reduceMotion ? 0.15 : (finePointer ? 0.35 : 0.5);
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    r: Math.random() * 1.6 + 0.6
                });
            }
            readColor();
        };

        var draw = function () {
            ctx.clearRect(0, 0, w, h);
            var linkDist = 130;

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
                var md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < 120 && md > 0) { p.x += (mdx / md) * 1.2; p.y += (mdy / md) * 1.2; }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + rgb + ',.7)';
                ctx.fill();

                for (var j = i + 1; j < particles.length; j++) {
                    var q = particles[j];
                    var dx = p.x - q.x, dy = p.y - q.y;
                    var d = dx * dx + dy * dy;
                    if (d < linkDist * linkDist) {
                        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.18 * (1 - Math.sqrt(d) / linkDist)) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        if (themeBtn) themeBtn.addEventListener('click', function () { setTimeout(readColor, 50); });

        resize();
        requestAnimationFrame(draw);
    }

    /* ---------- LinkedIn profile dialog ---------- */
    var dialog = $('#profileDialog');
    var lastFocus = null;

    function openProfile() {
        if (!dialog) return;
        lastFocus = document.activeElement;
        dialog.classList.remove('is-closing');
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        body.classList.add('modal-open');
        var card = $('.pd-card', dialog);
        if (card) card.scrollTop = 0;
    }

    function closeProfile() {
        if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return;

        var finish = function () {
            dialog.classList.remove('is-closing');
            if (typeof dialog.close === 'function') dialog.close();
            else dialog.removeAttribute('open');
        };

        dialog.classList.add('is-closing');
        setTimeout(finish, 280);
    }

    if (dialog) {
        $$('[data-open-profile]').forEach(function (btn) {
            btn.addEventListener('click', function (e) { e.preventDefault(); openProfile(); });
        });

        $$('[data-close-profile]', dialog).forEach(function (btn) {
            btn.addEventListener('click', closeProfile);
        });

        // Click on the backdrop (outside the card) closes the dialog.
        dialog.addEventListener('click', function (e) {
            if (e.target === dialog) closeProfile();
        });

        // Esc: animate out instead of the instant native close.
        dialog.addEventListener('cancel', function (e) {
            e.preventDefault();
            closeProfile();
        });

        dialog.addEventListener('close', function () {
            body.classList.remove('modal-open');
            if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        });

        // Deep link: /#profile opens the dialog straight away.
        if (window.location.hash === '#profile') openProfile();
    }

    /* ---------- Copy LinkedIn link ---------- */
    var toastEl = $('#toast');
    var toastTimer;

    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2200);
    }

    var copyBtn = $('#copyProfile');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            var url = copyBtn.getAttribute('data-url');

            var fallback = function () {
                var ta = document.createElement('textarea');
                ta.value = url;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                dialog.appendChild(ta);
                ta.select();
                var ok = false;
                try { ok = document.execCommand('copy'); } catch (e) {}
                dialog.removeChild(ta);
                toast(ok ? 'Profile link copied!' : url);
            };

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url).then(function () { toast('Profile link copied!'); }, fallback);
            } else {
                fallback();
            }
        });
    }
})();
