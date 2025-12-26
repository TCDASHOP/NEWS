/*!
 * SAIREN SPACE×MATH MATRIX (FULL SITE V1)
 * - deep space gradient is in CSS
 * - math symbol rain + starfield on canvas
 * - geometry overlay (svg)
 * - subtle page intro + link transition boost
 * - short scramble then settle for short labels (headers/cards/menu)
 */
(() => {
  "use strict";

  const CFG = {
    glyphs: "01∑∫πφ√⊗⊕ΔλΩψμν∞≈≠≤≥→↘︎⋯:.,",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 15,
    fade: 0.08,
    speedMin: 45,
    speedMax: 115,
    starCount: 120,
    introBoostMs: 650,
    transitionBoostMs: 520,
    transitionDelayMs: 380,
    scrambleMs: 420,
    maxScrambleChars: 64,
    neonA: [124,255,215],
    neonB: [120,180,255],
  };

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const now = ()=>performance.now();
  const rand = (a,b)=>a+Math.random()*(b-a);
  const pick = (s)=>s[Math.floor(Math.random()*s.length)];

  function injectLayers(){
    if(!document.getElementById("sairen-matrix-canvas")){
      const c = document.createElement("canvas");
      c.id = "sairen-matrix-canvas";
      c.setAttribute("aria-hidden","true");
      document.body.prepend(c);
    }
    if(!document.getElementById("sairen-geometry-overlay")){
      const d = document.createElement("div");
      d.id = "sairen-geometry-overlay";
      d.setAttribute("aria-hidden","true");
      d.style.backgroundImage = "url('/assets/images/ui/geometry-overlay.svg')";
      d.style.backgroundSize = "cover";
      d.style.backgroundPosition = "center";
      d.style.backgroundRepeat = "no-repeat";
      document.body.prepend(d);
    }
  }

  function scrambleTargets(){
    const sels = [
      ".brand-text",
      ".hero h1",
      ".tile-title",
      ".tile-hint",
      ".page-title",
      ".drawer a span:first-child"
    ];
    document.querySelectorAll(sels.join(",")).forEach(el=>{
      const raw = (el.textContent||"").trim();
      if(!raw) return;
      if(raw.length > CFG.maxScrambleChars) return;
      const end = now() + CFG.scrambleMs;
      const orig = raw;

      const step = ()=>{
        const t = now();
        const p = clamp(1 - (end - t) / CFG.scrambleMs, 0, 1);
        const keep = Math.floor(orig.length * p);
        let out = "";
        for(let i=0;i<orig.length;i++){
          out += (i<keep) ? orig[i] : pick(CFG.glyphs);
        }
        el.textContent = out;
        if(t < end) requestAnimationFrame(step);
        else el.textContent = orig;
      };
      requestAnimationFrame(step);
    });
  }

  function bindInternalTransitions(setBoost){
    document.addEventListener("click",(e)=>{
      const a = e.target.closest("a");
      if(!a) return;
      if(a.target === "_blank") return;
      if(!a.href) return;
      let u;
      try{ u = new URL(a.href, location.href); }catch{ return; }
      if(u.origin !== location.origin) return;
      if(u.pathname === location.pathname && u.hash) return;

      e.preventDefault();
      setBoost(CFG.transitionBoostMs);
      document.body.classList.add("sairen-transitioning");
      setTimeout(()=>location.href = a.href, CFG.transitionDelayMs);
    }, {capture:true});
  }

  function start(){
    injectLayers();
    const canvas = document.getElementById("sairen-matrix-canvas");
    const ctx = canvas.getContext("2d", {alpha:true});

    let w=0,h=0,dpr=1, stars=[], cols=[];

    function resize(){
      dpr = Math.max(1, window.devicePixelRatio||1);
      w = Math.floor(innerWidth);
      h = Math.floor(innerHeight);
      canvas.width = Math.floor(w*dpr);
      canvas.height = Math.floor(h*dpr);
      canvas.style.width = w+"px";
      canvas.style.height = h+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);

      stars = Array.from({length:CFG.starCount}).map(()=>({
        x: Math.random()*w, y: Math.random()*h,
        r: rand(0.6,1.8), v: rand(0.02,0.09), a: rand(0.15,0.55)
      }));

      const count = Math.floor(w / CFG.fontSize);
      cols = Array.from({length:count}).map(()=>({
        y: rand(-900,0),
        speed: rand(CFG.speedMin, CFG.speedMax),
        phase: Math.random()*Math.PI*2
      }));
    }
    resize();
    addEventListener("resize", resize);

    let boostUntil = 0;
    const setBoost = (ms)=>{ boostUntil = Math.max(boostUntil, now()+ms); };

    // intro
    setBoost(CFG.introBoostMs);
    scrambleTargets();
    bindInternalTransitions(setBoost);

    // re-scramble after i18n apply
    document.addEventListener("sairen:i18n-applied", ()=>scrambleTargets());

    let last = now();
    function draw(t){
      const dt = Math.min(0.05, (t-last)/1000);
      last = t;

      // fade
      ctx.fillStyle = `rgba(5,6,11,${CFG.fade})`;
      ctx.fillRect(0,0,w,h);

      // stars
      for(const s of stars){
        s.y += s.v*(dt*60);
        if(s.y > h+4){ s.y=-4; s.x=Math.random()*w; }
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      }

      const boost = (t < boostUntil) ? 1.65 : 1.0;

      // rain
      ctx.font = `${CFG.fontSize}px ${CFG.fontFamily}`;
      const colW = CFG.fontSize;
      for(let i=0;i<cols.length;i++){
        const c = cols[i];
        c.y += c.speed*dt*boost;
        if(c.y > h+200){
          c.y = rand(-900,-100);
          c.speed = rand(CFG.speedMin, CFG.speedMax);
          c.phase = Math.random()*Math.PI*2;
        }

        const x = i*colW;
        const mix = (Math.sin(c.phase + t*0.001)+1)/2;
        const r = Math.floor(CFG.neonA[0]*mix + CFG.neonB[0]*(1-mix));
        const g = Math.floor(CFG.neonA[1]*mix + CFG.neonB[1]*(1-mix));
        const b = Math.floor(CFG.neonA[2]*mix + CFG.neonB[2]*(1-mix));
        const alpha = 0.40*boost;

        for(let k=0;k<18;k++){
          const y = c.y - k*(CFG.fontSize*1.05);
          if(y<-50||y>h+50) continue;
          const ch = pick(CFG.glyphs);
          const a2 = alpha*(k===0?1.0:0.65);
          ctx.fillStyle = `rgba(${r},${g},${b},${a2})`;
          ctx.fillText(ch, x, y);
        }
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
