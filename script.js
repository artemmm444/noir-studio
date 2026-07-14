// ============ NOIR® ============
document.addEventListener('DOMContentLoaded', () => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  // --- Прелоадер: счётчик 000 → 100 ---
  const pre = document.getElementById('pre');
  const preNum = document.getElementById('preNum');
  if (reduce) {
    pre.remove();
    document.body.classList.add('loaded');
  } else {
    let n = 0;
    const t = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 16));
      preNum.textContent = String(n).padStart(3, '0');
      if (n >= 100) {
        clearInterval(t);
        setTimeout(() => {
          pre.classList.add('done');
          document.body.classList.add('loaded');
        }, 200);
        setTimeout(() => pre.remove(), 1100);
      }
    }, 65);
  }

  // --- Часы (Москва) ---
  const clock = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const tick = () => { clock.textContent = 'msk ' + fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);

  // --- Хедер, прогресс, скью ленты — один обработчик скролла ---
  const bar = document.getElementById('bar');
  const scrollbar = document.getElementById('scrollbar');
  const tape = document.querySelector('.tape');
  let lastY = scrollY, skewT = 0;
  const onScroll = () => {
    bar.classList.toggle('solid', scrollY > 24);
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollbar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!reduce && tape) {
      const v = scrollY - lastY;
      lastY = scrollY;
      skewT = Math.max(-4, Math.min(4, v * 0.12));
      tape.style.setProperty('--skew', skewT.toFixed(2) + 'deg');
      clearTimeout(onScroll._t);
      onScroll._t = setTimeout(() => tape.style.setProperty('--skew', '0deg'), 90);
    }
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // --- Туман в hero (canvas) ---
  const fog = document.getElementById('fog');
  if (fog && !reduce) {
    const ctx = fog.getContext('2d');
    const blobs = [
      { c: '43,59,234', r: .34, sx: .00021, sy: .00017, p: 0 },
      { c: '232,227,217', r: .26, sx: .00015, sy: .00023, p: 2 },
      { c: '43,59,234', r: .3, sx: .00019, sy: .00013, p: 4 },
      { c: '90,104,255', r: .22, sx: .00025, sy: .0002, p: 6 },
    ];
    const size = () => {
      if (!fog.offsetWidth) { setTimeout(size, 400); return; }
      fog.width = fog.offsetWidth * .5;
      fog.height = fog.offsetHeight * .5;
    };
    size();
    addEventListener('resize', size);
    (function draw(t) {
      const { width: w, height: h } = fog;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach((b) => {
        const x = w * (.5 + .42 * Math.sin(t * b.sx + b.p));
        const y = h * (.5 + .42 * Math.cos(t * b.sy + b.p * 1.7));
        const r = Math.max(w, h) * b.r;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.c},.16)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      requestAnimationFrame(draw);
    })(0);
  }

  // --- Пословный/побуквенный reveal ---
  const splitLetters = (el) => {
    let n = 0;
    el.childNodes.forEach((node) => {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      node.textContent.split('').forEach((ch) => {
        if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'w';
        const i = document.createElement('i');
        i.textContent = ch;
        i.style.setProperty('--i', n++);
        w.appendChild(i);
        frag.appendChild(w);
      });
      el.replaceChild(frag, node);
    });
    el.classList.add('wsplit');
  };
  if (!reduce) {
    document.querySelectorAll('.row__name').forEach(splitLetters);
    document.querySelectorAll('.contact__display > span').forEach(splitLetters);
    const wio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); wio.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.wsplit').forEach((el) => wio.observe(el));
  }

  // --- Мобильное меню ---
  const menu = document.getElementById('menu');
  const open = (v) => {
    menu.classList.toggle('open', v);
    menu.setAttribute('aria-hidden', String(!v));
  };
  document.getElementById('menuBtn').addEventListener('click', () => open(true));
  document.getElementById('menuClose').addEventListener('click', () => open(false));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => open(false)));

  // --- Scroll-reveal ---
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // --- Счётчики ---
  const cio = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to, dur = 1400, start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.count').forEach(c => cio.observe(c));

  // --- Индекс: превью следует за курсором ---
  const index = document.getElementById('index');
  const preview = document.getElementById('preview');
  if (fine && !reduce) {
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      preview.style.transform = `translate(${x}px,${y}px) translate(-50%,-56%)`;
      raf = (Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3) ? requestAnimationFrame(loop) : 0;
    };
    index.addEventListener('pointermove', (e) => {
      const r = index.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    document.querySelectorAll('.row').forEach(row => {
      row.addEventListener('pointerenter', () => {
        preview.dataset.p = row.dataset.p;
        preview.classList.add('on');
      });
      row.addEventListener('pointerleave', () => preview.classList.remove('on'));
    });
  }

  // --- Параллакс hero от мыши ---
  const heroDisplay = document.querySelector('.hero__display');
  if (heroDisplay && fine && !reduce) {
    const lines = heroDisplay.querySelectorAll('.hd__line');
    let px = 0, py = 0, cx = 0, cy = 0, praf = 0;
    const ploop = () => {
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      lines.forEach((l, i) => {
        const depth = (i + 1) * 3;
        l.style.transform = `translate(${cx * depth}px,${cy * depth * 0.6}px)`;
      });
      praf = (Math.abs(px - cx) > .001 || Math.abs(py - cy) > .001) ? requestAnimationFrame(ploop) : 0;
    };
    document.querySelector('.hero').addEventListener('pointermove', (e) => {
      px = e.clientX / innerWidth - .5;
      py = e.clientY / innerHeight - .5;
      if (!praf) praf = requestAnimationFrame(ploop);
    });
  }

  // --- Форма (заглушка) ---
  const form = document.getElementById('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    document.getElementById('formNote').hidden = false;
    form.querySelector('button').textContent = 'отправлено ✓';
    form.querySelectorAll('input,textarea').forEach(i => { i.value = ''; });
  });
});
