// "A day with BunnyBank": a small map and an Add form that fills itself in, one
// scene per signal the app's suggestions read (see BunnyBank/Core/Suggestions):
// where you are, the time, today's calendar, and the day of the month. The reason
// lines are the app's own wording (SuggestionExplanation, in both languages).
//
//   <div class="demo" data-demo></div>   (text comes from <html lang>)
//
// Plays by itself while on screen, with a pause button; the step buttons jump to a
// scene. Under Reduce Motion nothing moves on its own: each scene is shown at once.
(() => {
  const root = document.querySelector("[data-demo]");
  if (!root) return;
  const ja = document.documentElement.lang === "ja";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCENE_MS = 6200;

  // ---------- words ----------
  const T = ja ? {
    add: "支出を追加", save: "保存", amount: "金額", shop: "お店", category: "カテゴリ", note: "メモ",
    pause: "一時停止", play: "再生", today: "今日", sep: "9月", nearby: "近く", isNew: "新しいお店",
    signals: { where: "場所", when: "時間", plans: "予定", habits: "いつもの" },
    places: { cafe: "まちかどカフェ", eleven: "エイトイレブン", soba: "Soba Ya", mart: "サニーマート", home: "家", station: "駅", office: "会社" },
    week: ["日", "月", "火", "水", "木", "金", "土"],
  } : {
    add: "Add Expense", save: "Save", amount: "Amount", shop: "Shop", category: "Category", note: "Note",
    pause: "Pause", play: "Play", today: "Today", sep: "September", nearby: "Nearby", isNew: "New shop",
    signals: { where: "Where", when: "When", plans: "Plans", habits: "Habits" },
    places: { cafe: "Corner Café", eleven: "EightEleven", soba: "Soba Ya", mart: "Sunny Mart", home: "Home", station: "Station", office: "Office" },
    week: ["S", "M", "T", "W", "T", "F", "S"],
  };
  const P = T.places;
  const money = (v) => ja ? Math.round(v).toLocaleString("ja-JP")
    : v.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });

  const scenes = ja ? [
    { step: "8:05 駅で", clock: ["月曜", "8:05"], at: "cafe", you: [250, 240], signals: ["where", "when", "habits"], amount: 480,
      shop: { why: "近くで · いつもこの時間", chips: [P.cafe, P.eleven] },
      category: { why: `${P.cafe}で最近 · いつもこの金額`, chips: ["食事", "趣味"] },
      note: { why: "いつもこの時間", chips: ["ラテ", "モーニング"] },
      caption: "朝8時すぎ、駅前。いつもこの時間にラテを買うお店だから、お店・カテゴリ・メモがもう入っています。" },
    { step: "12:10 ランチの予定", clock: ["月曜", "12:10"], at: "soba", you: [470, 172], signals: ["plans", "habits"], amount: 1200, event: ["12:15", "Soba Yaでランチ"],
      shop: { why: "予定に合わせて", chips: [P.soba, P.cafe] },
      category: { why: "いつもこの金額", chips: ["食事"] },
      note: { why: "予定に合わせて", chips: ["ランチ"] },
      caption: "今日のカレンダーに「Soba Yaでランチ」。だからSoba Yaが先頭に。読むのは今日の予定だけ、iPhoneの中でだけです。" },
    { step: "19:40 帰り道", clock: ["月曜", "19:40"], at: "mart", you: [410, 370], signals: ["where"], amount: 680, reveal: "mart",
      shop: { why: "近く · この支出と一緒に保存", chips: [P.mart], fresh: true },
      category: { why: "近くで", chips: ["生活用品", "食事"] },
      note: { why: "いつもの", chips: ["牛乳とパン"] },
      caption: "まだ登録していないお店も、近くにあれば候補に。選んで保存すれば、場所を覚えたお店になります。" },
    { step: "25日 家賃", clock: ["25日", "9:00"], at: "home", you: [520, 370], signals: ["when"], amount: 85000, month: true,
      category: { why: "そろそろの頃", chips: ["住居費"] },
      note: { why: "毎月この頃", chips: ["家賃"] },
      caption: "25日の家賃、1日のジム。毎月決まった支出は、その頃になると先に出てきます。" },
  ] : [
    { step: "8:05 at the station", clock: ["Mon", "8:05"], at: "cafe", you: [250, 240], signals: ["where", "when", "habits"], amount: 4.8,
      shop: { why: "Near you · Usually around now", chips: [P.cafe, P.eleven] },
      category: { why: `Recent at ${P.cafe} · Usually this amount`, chips: ["Food", "Hobbies"] },
      note: { why: "Usually around now", chips: ["Latte", "Breakfast"] },
      caption: "8:05 by the station. This is where you get a latte around now, so the shop, category and note are already filled in." },
    { step: "12:10 lunch plans", clock: ["Mon", "12:10"], at: "soba", you: [470, 172], signals: ["plans", "habits"], amount: 11, event: ["12:15", "Lunch at Soba Ya"],
      shop: { why: "For your plans", chips: [P.soba, P.cafe] },
      category: { why: "Usually this amount", chips: ["Food"] },
      note: { why: "For your plans", chips: ["Lunch"] },
      caption: "Today's calendar says “Lunch at Soba Ya”, so Soba Ya comes first. Only today's events are read, and only on your iPhone." },
    { step: "19:40 on the way home", clock: ["Mon", "19:40"], at: "mart", you: [410, 370], signals: ["where"], amount: 6.2, reveal: "mart",
      shop: { why: "Nearby · Saved with this expense", chips: [P.mart], fresh: true },
      category: { why: "Near you", chips: ["Daily Necessities", "Food"] },
      note: { why: "Your usual", chips: ["Milk & bread"] },
      caption: "A shop you haven't saved yet? Places around you show up as you log. Pick one and it becomes a shop that knows where it is." },
    { step: "The 25th: rent", clock: ["25th", "9:00"], at: "home", you: [520, 370], signals: ["when"], amount: 1200, month: true,
      category: { why: "Due about now", chips: ["Housing"] },
      note: { why: "Usually this time of month", chips: ["Rent"] },
      caption: "Rent on the 25th, the gym on the 1st. What's regular comes back around when it's due." },
  ];

  // ---------- map ----------
  const icon = {
    cafe: "M-6-4h10v5a5 5 0 0 1-10 0zM4-2h2a2 2 0 0 1 0 4h-2",
    soba: "M-8-1h16a8 8 0 0 1-16 0zM-2-8l2 6M4-9l-2 7",
    mart: "M-7-2h14v8h-14zM-8-7h16l-1 5h-14zM-2 6v-4h4v4",
    eleven: "M-7-2h14v8h-14zM-8-7h16l-1 5h-14zM-2 6v-4h4v4",
    home: "M-8 0l8-7 8 7M-5-2v8h10v-8",
    station: "M-6-7h12v10h-12zM-6-1h12M-4 5l-2 3M4 5l2 3",
    office: "M-6-8h12v16h-12zM-3-5h2M1-5h2M-3-1h2M1-1h2M-3 3h2M1 3h2",
  };
  const pins = {
    station: [110, 110, "l"], cafe: [250, 196, "r"], eleven: [70, 196, "r"],
    office: [585, 130, "l"], soba: [470, 128, "l"], mart: [410, 322, "l"], home: [540, 322, "r"],
  };
  const routes = {
    "0>1": [[250, 240], [470, 240], [470, 172]],
    "1>2": [[470, 172], [470, 240], [410, 240], [410, 370]],
    "2>3": [[410, 370], [520, 370]],
    "3>0": [[520, 370], [410, 370], [410, 240], [250, 240]],
  };

  const svgPin = (id) => {
    const [x, y, side] = pins[id];
    const label = P[id];
    const w = [...label].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 12.5 : 7.4), 0) + 18;
    const lx = side === "l" ? -22 - w : 22;
    return `<g class="pin pin-${id}${id === "mart" ? " pin-hidden" : ""}" data-pin="${id}" transform="translate(${x} ${y})">
      <g class="pin-body">
        <circle class="pin-ring" r="24"/>
        <circle class="pin-dot" r="16"/>
        <path class="pin-icon" d="${icon[id]}"/>
        <g class="pin-label" transform="translate(${lx} -12)"><rect width="${w}" height="24" rx="12"/><text x="${w / 2}" y="16.5">${label}</text></g>
        ${id === "mart" ? `<g class="pin-new" transform="translate(10 -24)"><rect x="-4" y="-10" width="${ja ? 70 : 64}" height="18" rx="9"/><text x="${(ja ? 70 : 64) / 2 - 4}" y="3">${T.isNew}</text></g>` : ""}
      </g></g>`;
  };

  const map = `
  <svg class="map-svg" viewBox="0 0 640 460" aria-hidden="true" focusable="false">
    <rect class="m-ground" width="640" height="460"/>
    <path class="m-river" d="M-20 420 C 90 390, 140 460, 250 470"/>
    <g class="m-park"><path d="M560 250 q60 -10 90 20 v80 q-50 10 -90 -20 z"/><circle cx="590" cy="280" r="9"/><circle cx="612" cy="300" r="7"/><circle cx="585" cy="310" r="6"/></g>
    <g class="m-blocks">
      <rect x="20" y="130" width="160" height="90" rx="10"/><rect x="225" y="130" width="160" height="90" rx="10"/>
      <rect x="20" y="262" width="160" height="80" rx="10"/><rect x="225" y="262" width="160" height="88" rx="10"/>
      <rect x="490" y="10" width="130" height="210" rx="10"/><rect x="330" y="10" width="120" height="80" rx="10"/>
      <rect x="430" y="262" width="110" height="88" rx="10"/><rect x="330" y="392" width="60" height="60" rx="10"/>
      <rect x="430" y="392" width="200" height="60" rx="10"/><rect x="225" y="392" width="60" height="60" rx="10"/>
    </g>
    <g class="m-roads m-roads-edge"><path d="M-10 240 H650"/><path d="M200 240 V470"/><path d="M410 240 V470"/><path d="M470 -10 V240"/>
      <path d="M300 240 V370 M200 370 H650"/><path d="M200 110 V240"/></g>
    <g class="m-roads"><path d="M-10 240 H650"/><path d="M200 240 V470"/><path d="M410 240 V470"/><path d="M470 -10 V240"/>
      <path d="M300 240 V370 M200 370 H650"/><path d="M200 110 V240"/></g>
    <g class="m-rail"><path class="m-rail-base" d="M-10 110 H650"/><path class="m-rail-ties" d="M-10 110 H650"/></g>
    <g class="m-near" transform="translate(250 240)"><circle r="70"/></g>
    <g class="pins">${Object.keys(pins).map(svgPin).join("")}</g>
    <g class="you" transform="translate(250 240)"><circle class="you-pulse" r="12"/><circle class="you-dot" r="9"/></g>
  </svg>`;

  // ---------- markup ----------
  const sig = {
    where: "M0-8a6 6 0 0 1 6 6c0 5-6 11-6 11s-6-6-6-11a6 6 0 0 1 6-6zM0-4a2 2 0 1 0 0.01 0",
    when: "M0-8a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM0-4v4l3 2",
    plans: "M-7-5h14v12h-14zM-7-1h14M-3-8v5M3-8v5",
    habits: "M-7 0a7 7 0 0 1 12-5l2 2M7 0a7 7 0 0 1-12 5l-2-2M5-7v4h4M-5 7v-4h-4",
  };
  const sigIcon = (k) => `<svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="${sig[k]}"/></svg>`;

  root.innerHTML = `
    <div class="demo-stage">
      <div class="demo-map">
        ${map}
        <div class="demo-clock" aria-hidden="true"><span class="clock-day"></span><span class="clock-time"></span></div>
        <div class="demo-event" aria-hidden="true"><span class="ev-when">${T.today} · <b></b></span><span class="ev-title"></span></div>
        <div class="demo-month" aria-hidden="true"><p>${T.sep}</p><div class="month-grid">${
          T.week.map((d) => `<i>${d}</i>`).join("") + "<span></span><span></span>" +
          Array.from({ length: 30 }, (_, i) => `<span${i + 1 === 25 ? ' class="due"' : ""}>${i + 1}</span>`).join("")
        }</div></div>
      </div>
      <div class="demo-phone" aria-hidden="true">
        <div class="dp-head"><span>${T.add}</span><span class="dp-save">${T.save}</span></div>
        <div class="dp-amount"><small>${T.amount}</small><strong><span class="dp-cur">${ja ? "¥" : "$"}</span><span class="dp-num">0</span></strong></div>
        ${["shop", "category", "note"].map((r) => `
        <div class="dp-row" data-row="${r}"><b>${T[r]}</b><p class="dp-why"></p><div class="dp-chips"></div></div>`).join("")}
        <div class="mochi dp-mochi" data-motion="idle"></div>
        <span class="dp-tap"></span>
      </div>
    </div>
    <div class="demo-signals" aria-hidden="true">${Object.keys(sig).map((k) =>
      `<span class="sig" data-sig="${k}">${sigIcon(k)}${T.signals[k]}</span>`).join("")}</div>
    <div class="demo-controls">
      <div class="demo-steps">${scenes.map((s, i) =>
        `<button type="button" class="step" data-step="${i}" aria-pressed="false"><span>${s.step}</span><i></i></button>`).join("")}</div>
      <button type="button" class="demo-pause" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path class="i-pause" d="M6 4v12M14 4v12"/><path class="i-play" d="M6 4l10 6-10 6z"/></svg><span>${T.pause}</span></button>
    </div>
    <p class="demo-caption" aria-live="polite"></p>`;

  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const you = $(".you"), near = $(".m-near"), num = $(".dp-num"), tap = $(".dp-tap");
  const mochi = $(".dp-mochi");
  let current = -1, timers = [], advance = 0, playing = !reduce, visible = false, youAt = [250, 240], raf = 0;

  const later = (ms, fn) => timers.push(setTimeout(fn, reduce ? 0 : ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; clearTimeout(advance); cancelAnimationFrame(raf); };

  function moveYou(to, from) {
    const key = `${from}>${to}`;
    const path = routes[key] || [youAt, scenes[to].you];
    const segs = path.slice(1).map((p, i) => [path[i], p, Math.hypot(p[0] - path[i][0], p[1] - path[i][1])]);
    const total = segs.reduce((a, s) => a + s[2], 0) || 1;
    const place = ([x, y]) => {
      youAt = [x, y];
      you.setAttribute("transform", `translate(${x} ${y})`);
      near.setAttribute("transform", `translate(${x} ${y})`);
    };
    if (reduce) return place(scenes[to].you);
    const dur = Math.min(1400, 500 + total * 2.2), t0 = performance.now();
    const ease = (t) => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = (now) => {
      let d = ease(Math.max(0, Math.min(1, (now - t0) / dur))) * total;
      for (const [a, b, len] of segs) {
        if (d <= len) { const k = len ? d / len : 1; place([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); break; }
        d -= len;
      }
      if (now - t0 < dur) raf = requestAnimationFrame(step); else place(scenes[to].you);
    };
    raf = requestAnimationFrame(step);
  }

  function countUp(to) {
    if (reduce) { num.textContent = money(to); return; }
    const t0 = performance.now(), dur = 650;
    const step = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      const v = to * (1 - (1 - k) ** 3);
      num.textContent = money(k < 1 ? (Number.isInteger(to) ? Math.round(v) : Math.round(v * 10) / 10) : to);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    timers.push(setTimeout(() => { num.textContent = money(to); }, dur + 100)); // in case frames are throttled
  }

  function fillRow(row, data) {
    const el = $(`[data-row="${row}"]`);
    el.classList.toggle("off", !data);
    if (!data) return;
    el.querySelector(".dp-why").textContent = data.why;
    el.querySelector(".dp-chips").innerHTML = data.chips.map((c, i) =>
      `<span class="chip${data.fresh && i === 0 ? " fresh" : ""}" style="--i:${i}">${c}${data.fresh && i === 0 ? `<small>${T.isNew}</small>` : ""}</span>`).join("");
  }

  function show(i) {
    clear();
    const from = current, s = scenes[i];
    current = i;
    root.style.setProperty("--scene-ms", `${SCENE_MS}ms`);
    $$(".step").forEach((b, k) => {
      b.setAttribute("aria-pressed", k === i);
      b.classList.toggle("done", k < i);
      b.classList.remove("run");
    });
    const btn = $(`.step[data-step="${i}"]`);
    if (playing) { void btn.offsetWidth; btn.classList.add("run"); }

    // map
    $(".clock-day").textContent = s.clock[0];
    $(".clock-time").textContent = s.clock[1];
    root.classList.toggle("is-event", !!s.event);
    root.classList.toggle("is-month", !!s.month);
    if (s.event) { $(".ev-when b").textContent = s.event[0]; $(".ev-title").textContent = s.event[1]; }
    $$(".pin").forEach((p) => p.classList.toggle("hot", p.dataset.pin === s.at));
    $(".pin-mart").classList.toggle("pin-hidden", !s.reveal && i < 2);
    near.classList.toggle("on", s.signals.includes("where"));
    moveYou(i, from);
    $$(".sig").forEach((g) => g.classList.toggle("on", s.signals.includes(g.dataset.sig)));
    $(".demo-caption").textContent = s.caption;

    // form: empty, then suggestions arrive, then the top ones are picked
    root.classList.remove("picked", "saved");
    root.classList.add("clearing");
    num.textContent = "0";
    mochi.mochi?.play("think");
    later(380, () => {
      root.classList.remove("clearing");
      fillRow("shop", s.shop); fillRow("category", s.category); fillRow("note", s.note);
    });
    later(2100, () => {
      const top = $(".dp-row:not(.off) .chip");
      if (top && !reduce) {
        const r = top.getBoundingClientRect(), b = $(".demo-phone").getBoundingClientRect();
        tap.style.left = `${r.left - b.left + 24}px`;
        tap.style.top = `${r.top - b.top + r.height / 2}px`;
        tap.classList.remove("go"); void tap.offsetWidth; tap.classList.add("go");
      }
      root.classList.add("picked");
      countUp(s.amount);
    });
    later(3300, () => { root.classList.add("saved"); mochi.mochi?.play(i === 3 ? "celebrate" : "nod", "idle"); });
    if (playing) advance = setTimeout(() => visible && playing && show((i + 1) % scenes.length), SCENE_MS);
  }

  function setPlaying(on) {
    playing = on;
    const b = $(".demo-pause");
    b.setAttribute("aria-pressed", !on);
    b.querySelector("span").textContent = on ? T.pause : T.play;
    root.classList.toggle("paused", !on);
    if (on) show((current + 1) % scenes.length);
    else { clearTimeout(advance); $$(".step").forEach((s) => s.classList.remove("run")); }
  }

  $$(".step").forEach((b) => b.addEventListener("click", () => show(Number(b.dataset.step))));
  $(".demo-pause").addEventListener("click", () => setPlaying(!playing));
  if (reduce) { $(".demo-pause").hidden = true; root.classList.add("paused"); }

  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && current < 0) show(0);
    else if (visible && !was && playing) show(current);
  }, { threshold: 0.3 }).observe(root);
})();
