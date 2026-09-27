// Plays Mochi's motions from the 13-frame sprite strips in img/, with the same
// order and holds as the app (BunnyBank/Core/Character/CharacterMotion.swift).
//
//   <div class="mochi" data-motion="greet" data-then="idle"></div>
//
// A looping motion loops; one that plays once holds its last pose, then either
// switches to data-then or, with data-rest="3", starts again after that many
// seconds. Only plays while on screen; tapping Mochi makes it hop.
// Under Reduce Motion it shows the motion's key pose and nothing moves.
(() => {
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const M = {
    idle:      { loop: true,  key: 0,  seq: range(0, 12), holds: [1.6, .12, .15, .15, .4, .15, .15, .04, .08, .04, .15, .7, .15] },
    think:     { loop: true,  key: 8,  seq: [0, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 10, 11, 12], holds: [.5, .15, .4, .15, .5, .12, .12, .12, .3, .15, .7, .4, .4, .15, .15] },
    sleep:     { loop: true,  key: 4,  seq: range(1, 12), holds: [.8, .3, .3, .8, .6, .8, .6, 1, .5, .3, .3, .8] },
    hop:       { loop: false, key: 5,  seq: [...range(0, 12), 0], holds: [.06, .05, .12, .04, .04, .16, .05, .05, .1, .05, .05, .15, .1, .3] },
    celebrate: { loop: false, key: 12, seq: range(0, 12), holds: [.08, .06, .08, .2, .06, .1, .05, .05, .22, .06, .1, .1, .6] },
    greet:     { loop: false, key: 12, seq: range(0, 12), holds: [.08, .06, .06, .06, .12, .1, .1, .1, .12, .1, .08, .1, .5] },
    present:   { loop: false, key: 12, seq: range(0, 12), holds: [.12, .06, .06, .06, .06, .3, .1, .15, .2, .1, .1, .2, .5] },
    nod:       { loop: false, key: 12, seq: range(0, 12), holds: [.08, .05, .05, .12, .05, .08, .05, .1, .05, .1, .08, .2, .4] },
  };
  const sitting = new Set(["idle", "think"]);
  // Pages in /ja/ share the root's images: resolve them next to this script.
  const base = new URL("img/", document.currentScript.src).href;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const loaded = {};
  const load = (name) => (loaded[name] ??= new Promise((done) => {
    const img = new Image();
    img.onload = img.onerror = done;
    img.src = `${base}bunny-${name}.webp`;
  }));

  class Player {
    constructor(el) {
      this.el = el;
      this.home = el.dataset.motion || "idle";
      this.visible = false;
      el.mochi = this; // so the demo can cue a reaction: el.mochi.play("nod", "idle")
      this.el.setAttribute("role", "img");
      if (!this.el.hasAttribute("aria-label")) this.el.setAttribute("aria-label", document.documentElement.lang === "ja" ? "BunnyBankのうさぎ、Mochi" : "Mochi, the BunnyBank bunny");
      this.el.addEventListener("click", () => this.play("hop", this.motion === "hop" ? this.after : this.motion));
    }
    async play(name, after) {
      const changesPosture = this.motion && sitting.has(this.motion) !== sitting.has(name);
      this.motion = name;
      this.after = after;
      this.start = null;
      this.pose = -1;
      await load(name);
      if (this.motion !== name) return;
      const show = () => {
        this.el.style.backgroundImage = `url(${base}bunny-${name}.webp)`;
        this.draw(reduce.matches ? M[name].key : M[name].seq[0]);
      };
      if (changesPosture && !reduce.matches) {
        // No in-between is drawn for sitting <-> standing, so crossfade like the app.
        this.el.classList.add("swap");
        setTimeout(() => { show(); this.el.classList.remove("swap"); }, 180);
      } else show();
      if (after) load(after);
    }
    draw(pose) {
      if (pose === this.pose) return;
      this.pose = pose;
      this.el.style.backgroundPosition = `${(pose * 100) / 12}% 0`;
    }
    tick(now) {
      const m = M[this.motion];
      if (!m || reduce.matches || !this.el.style.backgroundImage) return;
      this.start ??= now;
      const rest = Number(this.el.dataset.rest) || 0;
      const holds = m.holds.slice();
      if (!m.loop && rest && !this.after) holds[holds.length - 1] += rest;
      const total = holds.reduce((a, b) => a + b, 0);
      let t = (now - this.start) / 1000;
      if (!m.loop && !(rest && !this.after) && t >= total) {
        this.draw(m.seq[m.seq.length - 1]);
        if (this.after) this.play(this.after, null);
        return;
      }
      t %= total;
      for (let i = 0; i < holds.length; i++) {
        if (t < holds[i]) return this.draw(m.seq[i]);
        t -= holds[i];
      }
    }
  }

  const players = [...document.querySelectorAll(".mochi")].map((el) => new Player(el));
  const byEl = new Map(players.map((p) => [p.el, p]));

  // Load a strip shortly before it scrolls in; start the motion when it's in view.
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { load(byEl.get(e.target).home); near.unobserve(e.target); }
  }, { rootMargin: "400px 0px" });
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const p = byEl.get(e.target);
      p.visible = e.isIntersecting;
      if (p.visible && !p.motion) p.play(p.home, p.el.dataset.then || null);
    }
  }, { threshold: 0.35 });
  players.forEach((p) => { near.observe(p.el); seen.observe(p.el); });

  const frame = (now) => {
    for (const p of players) if (p.visible) p.tick(now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
