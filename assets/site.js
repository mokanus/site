// 咕噜研习社官网 · 交互与动效（无依赖）
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 顶栏滚动后加底色
  const top = document.querySelector('.top');
  const onScroll = () => top && top.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 进入视口时淡入
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  // 数字滚动
  const countIO = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    reduce ? (el.textContent = end) : requestAnimationFrame(step);
    countIO.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO ? countIO.observe(el) : (el.textContent = el.dataset.count));

  // 鼠标视差（只在有鼠标的设备上）
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    $$('[data-tilt]').forEach(box => {
      const items = $$('[data-depth]', box);
      box.addEventListener('pointermove', e => {
        const r = box.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        items.forEach(it => {
          const d = +it.dataset.depth;
          it.style.translate = `${x * d}px ${y * d}px`;
        });
      });
      box.addEventListener('pointerleave', () => items.forEach(it => (it.style.translate = '')));
    });
  }

  // 滚动视差
  const par = $$('[data-parallax]');
  if (par.length && !reduce) {
    const tick = () => {
      par.forEach(el => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - innerHeight / 2) * +el.dataset.parallax;
        el.style.transform = `translateY(${off}px)`;
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });
    tick();
  }

  // 通用切换器：按钮切换图片和主题色，自动轮播直到用户点击
  $$('[data-picker]').forEach(picker => {
    const btns = $$('[data-pick]', picker);
    const scope = picker.closest('[data-picker-scope]') || document;
    const imgs = $$('[data-pick-img]', scope);
    const name = scope.querySelector('[data-pick-name]');
    const tag = scope.querySelector('[data-pick-tag]');
    let i = 0, timer;
    const show = n => {
      i = n;
      const b = btns[n];
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      imgs.forEach(img => img.classList.toggle('on', img.dataset.pickImg === b.dataset.pick));
      if (b.dataset.glow) scope.style.setProperty('--glow', b.dataset.glow);
      if (name) name.textContent = b.dataset.name || '';
      if (tag) tag.textContent = b.dataset.tag || '';
    };
    btns.forEach((b, n) => b.addEventListener('click', () => { clearInterval(timer); show(n); }));
    show(0);
    if (!reduce && picker.dataset.auto) timer = setInterval(() => show((i + 1) % btns.length), +picker.dataset.auto);
  });

  // 画廊左右按钮
  $$('[data-gallery]').forEach(g => {
    const track = document.getElementById(g.dataset.gallery);
    $$('button', g).forEach(b => b.addEventListener('click', () => {
      track.scrollBy({ left: (+b.dataset.dir) * Math.min(600, track.clientWidth * .8), behavior: reduce ? 'auto' : 'smooth' });
    }));
  });

  // 标签页
  $$('[role=tablist]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on);
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
    }));
  });

  // 金币雨
  $$('.coins-rain').forEach(rain => {
    if (reduce) return;
    for (let k = 0; k < 8; k++) {
      const c = document.createElement('span');
      c.className = 'coin';
      c.textContent = '¥';
      c.style.left = Math.random() * 100 + '%';
      c.style.animationDuration = 9 + Math.random() * 9 + 's';
      c.style.animationDelay = -Math.random() * 18 + 's';
      c.style.scale = .6 + Math.random() * .7;
      rain.appendChild(c);
    }
  });
})();
