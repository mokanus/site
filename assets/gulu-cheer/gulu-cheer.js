// 咕噜比耶动画 <gulu-cheer>（无依赖，可跨项目引用）
// 用法：<script src="https://www.funbits.cn/assets/gulu-cheer/gulu-cheer.js" defer> 再放 <gulu-cheer>（注释里不写闭合 script 标签，方便内联）
//       <gulu-cheer size="220"></gulu-cheer>
// 属性：size 边长 px（默认 200）；trigger = auto | visible | click | manual（默认 visible）；
//       once 只播一遍后停在比耶；src 帧图目录（默认与本脚本同站的 kraft/cheer/）
// 方法：el.play() 重新播放；el.stop() 停在比耶帧。事件：gulu-cheer:peace（比耶出现的瞬间）
(() => {
  if (customElements.get('gulu-cheer')) return;

  const here = document.currentScript && document.currentScript.src;
  const DEFAULT_SRC = new URL('../img/brand/character/kraft/cheer/', here || location.href).href;
  const FRAMES = ['cheer-0', 'cheer-1', 'cheer-2', 'cheer-3']; // 待机 / 比耶 / 眨眼 / 大笑

  // 时间轴（毫秒）。intro 只播一次，loop 循环；与 timeline.json 保持一致
  const INTRO = [
    { f: 0, ms: 700, fx: 'breathe' },
    { f: 1, ms: 900, fx: 'pop' },
  ];
  const LOOP = [
    { f: 2, ms: 420, fx: 'tilt' },
    { f: 1, ms: 700 },
    { f: 3, ms: 760, fx: 'hop' },
    { f: 1, ms: 1600 },
  ];

  const css = `
:host{display:inline-block;position:relative;width:var(--size,200px);aspect-ratio:1;line-height:0;-webkit-tap-highlight-color:transparent}
.stage{position:absolute;inset:0;transform-origin:50% 92%}
img{position:absolute;inset:0;width:100%;height:100%;opacity:0;user-select:none;-webkit-user-drag:none;pointer-events:none}
img.on{opacity:1}
.stage.breathe{animation:breathe 1.4s ease-in-out infinite}
.stage.pop{animation:pop .62s cubic-bezier(.3,1.6,.5,1) both}
.stage.tilt{animation:tilt .42s ease-out both}
.stage.hop{animation:hop .76s cubic-bezier(.3,1.4,.5,1) both}
.stage.idle{animation:sway 3.2s ease-in-out infinite}
@keyframes breathe{50%{transform:scale(1.012,.992)}}
@keyframes pop{0%{transform:scale(.9,1.06) translateY(3%)}45%{transform:scale(1.06,.95) translateY(-3%)}75%{transform:scale(.98,1.02)}100%{transform:none}}
@keyframes tilt{40%{transform:rotate(-3deg) translateY(-1%)}100%{transform:none}}
@keyframes hop{30%{transform:translateY(-4%) scale(1.02,.98)}60%{transform:translateY(0) scale(1.03,.97)}80%{transform:translateY(-1.5%)}100%{transform:none}}
@keyframes sway{25%{transform:rotate(1deg)}75%{transform:rotate(-1deg)}}
.spark{position:absolute;width:11%;aspect-ratio:1;opacity:0;pointer-events:none;filter:drop-shadow(0 2px 1px rgba(60,40,20,.25))}
.spark.go{animation:spark .9s cubic-bezier(.2,.8,.3,1) both}
@keyframes spark{0%{opacity:0;transform:translate(0,0) scale(.2) rotate(0)}30%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1) rotate(var(--r))}}
@media (prefers-reduced-motion:reduce){.stage,.spark{animation:none!important}}
`;

  // 毛毡风小装饰：金星、珊瑚爱心、暖橙水滴，方向与落点
  const STAR = '<svg viewBox="0 0 24 24"><path fill="#D6B06A" stroke="#A97A26" stroke-width="1" d="M12 2l2.6 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.6 6.2 20l1.6-6.6L2.6 8.9l6.8-.6z"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24"><path fill="#EC8E74" stroke="#C9664D" stroke-width="1" d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>';
  const DROP = '<svg viewBox="0 0 24 24"><path fill="#ECAD5A" stroke="#B97E2E" stroke-width="1" d="M12 2c3 5 6 8.5 6 12a6 6 0 0 1-12 0c0-3.5 3-7 6-12z"/></svg>';
  const SPARKS = [
    { svg: STAR, x: 14, y: 22, dx: '-60%', dy: '-90%', r: '-30deg', d: 0 },
    { svg: HEART, x: 76, y: 18, dx: '70%', dy: '-90%', r: '25deg', d: 60 },
    { svg: DROP, x: 8, y: 44, dx: '-90%', dy: '-20%', r: '-50deg', d: 120 },
    { svg: STAR, x: 82, y: 42, dx: '90%', dy: '-30%', r: '40deg', d: 90 },
    { svg: HEART, x: 22, y: 8, dx: '-40%', dy: '-70%', r: '-15deg', d: 150 },
  ];

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  class GuluCheer extends HTMLElement {
    static get observedAttributes() { return ['size', 'src']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${css}</style><div class="stage" part="stage"></div>`;
      this.stage = root.querySelector('.stage');
      this.timer = 0;
      this.sparks = SPARKS.map(s => {
        const el = document.createElement('div');
        el.className = 'spark';
        el.innerHTML = s.svg;
        Object.assign(el.style, { left: s.x + '%', top: s.y + '%', animationDelay: s.d + 'ms' });
        el.style.setProperty('--dx', s.dx);
        el.style.setProperty('--dy', s.dy);
        el.style.setProperty('--r', s.r);
        root.appendChild(el);
        return el;
      });
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', '咕噜双手比耶');
      this.render();
      const trigger = this.getAttribute('trigger') || 'visible';
      if (trigger === 'click') {
        this.show(0);
        this.addEventListener('click', () => this.play());
      } else if (trigger === 'auto') {
        this.play();
      } else if (trigger === 'visible' && 'IntersectionObserver' in window) {
        this.show(0);
        this.io = new IntersectionObserver(es => {
          if (es.some(e => e.isIntersecting)) { this.play(); this.io.disconnect(); }
        }, { threshold: .4 });
        this.io.observe(this);
      } else if (trigger !== 'manual') {
        this.play();
      } else {
        this.show(0);
      }
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      this.io && this.io.disconnect();
    }

    attributeChangedCallback() { if (this.stage.childElementCount) this.render(); }

    render() {
      const size = parseFloat(this.getAttribute('size')) || 200;
      this.style.setProperty('--size', size + 'px');
      let src = this.getAttribute('src') || DEFAULT_SRC;
      if (!src.endsWith('/')) src += '/';
      const cur = this.frame || 0;
      this.stage.innerHTML = FRAMES.map((n, i) =>
        `<img src="${src}${n}.webp" alt="" decoding="async" draggable="false"${i === cur ? ' class="on"' : ''}>`).join('');
      this.imgs = [...this.stage.children];
    }

    show(f, fx) {
      this.frame = f;
      this.imgs.forEach((img, i) => img.classList.toggle('on', i === f));
      this.stage.className = 'stage';
      void this.stage.offsetWidth; // 重新触发同名动画
      this.stage.classList.add(fx || 'idle');
      if (fx === 'pop') {
        this.burst();
        this.dispatchEvent(new CustomEvent('gulu-cheer:peace', { bubbles: true }));
      }
    }

    burst() {
      this.sparks.forEach(s => { s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); });
    }

    play() {
      clearTimeout(this.timer);
      if (reduce()) { this.show(1); this.stage.className = 'stage'; return; }
      const once = this.hasAttribute('once');
      const seq = INTRO.concat(LOOP);
      let i = 0;
      const step = () => {
        if (i >= seq.length) {
          if (once) return this.show(1);
          i = INTRO.length;
        }
        const k = seq[i++];
        this.show(k.f, k.fx);
        this.timer = setTimeout(step, k.ms);
      };
      step();
    }

    stop() {
      clearTimeout(this.timer);
      this.show(1);
    }
  }

  customElements.define('gulu-cheer', GuluCheer);
})();
