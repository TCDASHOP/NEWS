/* SAIREN COLOR ARCHIVE - site.js (FULL SITE V1)
   - i18n: replace all [data-i18n] (textContent) and [data-i18n-html] (innerHTML)
   - lang switch: keep same page while switching /<lang>/ folder
   - hamburger drawer: opens menu (HOME/WORKS/ABOUT/LOOKBOOK/SNS/CONTACT/LICENSE)
   - works: render formed-only grid from /assets/data/works.json
*/
(() => {
  "use strict";
  const SUPPORTED = ["ja","en","es","fr","ko","zh-hans"];
  const DEFAULT_LANG = "ja";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function detectLangFromPath(){
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return SUPPORTED.includes(seg) ? seg : "ja";
  }

  function currentPageFile(){
    const parts = location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length-1] || "index.html";
    // if folder root (/) then index
    if (!last || !last.includes(".")) return "index.html";
    return last;
  }

  function langBase(lang){
    return (lang === "ja") ? "/" : `/${lang}/`;
  }

  function gotoLang(lang){
    const page = currentPageFile();
    location.href = `${langBase(lang)}${page}`;
  }

  async function loadI18n(){
    const res = await fetch("/assets/data/i18n.json", { cache: "no-store" });
    if(!res.ok) throw new Error("i18n.json not found");
    return await res.json();
  }

  function getText(dict, key, lang){
    const node = (dict.i18n||{})[key];
    if(!node) return "";
    return node[lang] ?? node[DEFAULT_LANG] ?? "";
  }

  function applyI18n(dict, lang){
    // textContent replacements
    $$("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const text = getText(dict, key, lang);
      el.textContent = text;
    });
    // innerHTML replacements (ABOUT body)
    $$("[data-i18n-html]").forEach(el => {
      const key = el.getAttribute("data-i18n-html");
      const html = getText(dict, key, lang);
      el.innerHTML = html;
    });

    const siteName = getText(dict, "siteName", lang) || "SAIREN COLOR ARCHIVE";
    document.title = siteName;

    // dispatch hook for matrix.js to re-scramble short labels
    document.dispatchEvent(new CustomEvent("sairen:i18n-applied"));
  }

  function wireBrandHome(){
    const brand = $(".brand");
    if(!brand) return;
    brand.addEventListener("click", () => {
      const lang = detectLangFromPath();
      location.href = (lang==="ja") ? "/index.html" : `/${lang}/index.html`;
    });
  }

  function wireLangSelect(lang){
    const sel = $("[data-lang-select]");
    if(!sel) return;
    sel.value = lang;
    sel.addEventListener("change", () => {
      const next = sel.value;
      localStorage.setItem("lang", next);
      gotoLang(next);
    });
  }

  function buildDrawer(dict, lang){
    const drawer = $("#drawer");
    const backdrop = $("#drawerBackdrop");
    const btn = $("#hamburgerBtn");
    if(!drawer || !backdrop || !btn) return;

	  // Drawer (hamburger) menu items.
	  // NOTE: WORKS / ABOUT / LOOKBOOK / SHOP are intentionally NOT listed here,
	  // because they already exist as HOME cards. This keeps the UI clean.
	  const items = [
	    { key:"nav.home", page:"index.html", icon:"⌂" },
	    { key:"nav.sns", page:"sns.html", icon:"◎" },
	    { key:"nav.contact", page:"contact.html", icon:"✉" },
	    { key:"nav.license", page:"license.html", icon:"§" },
	  ];

    const nav = document.createElement("div");
	  items.forEach(it => {
	    const a = document.createElement("a");
	    if(it.external){
	      a.href = it.href;
	      a.target = "_blank";
	      a.rel = "noopener";
	    }else{
	      a.href = `${langBase(lang)}${it.page}`;
	    }
	    a.innerHTML = `<span data-i18n="${it.key}"></span><span class="chev">›</span>`;
	    nav.appendChild(a);
	  });
    drawer.innerHTML = "";
    drawer.appendChild(nav);

    const open = () => {
      backdrop.classList.add("is-open");
      drawer.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      // reapply i18n because we injected data-i18n
      applyI18n(dict, lang);
    };
    const close = () => {
      backdrop.classList.remove("is-open");
      drawer.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if(drawer.classList.contains("is-open")) close();
      else open();
    });
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if(e.key==="Escape") close(); });
  }

  async function renderWorks(dict, lang){
    const grid = $("#worksGrid");
    if(!grid) return;
    grid.innerHTML = `<div class="card"><p data-i18n="ui.loading"></p></div>`;
    applyI18n(dict, lang);

    const res = await fetch("/assets/data/works.json", { cache:"no-store" });
    if(!res.ok){
      grid.innerHTML = `<div class="card"><p>works.json not found</p></div>`;
      return;
    }
    const data = await res.json();
    const works = Array.isArray(data.works) ? data.works : [];
    if(works.length === 0){
      grid.innerHTML = `<div class="card"><p>No works</p></div>`;
      return;
    }

    grid.innerHTML = "";
    works.forEach(w => {
      const card = document.createElement("div");
      card.className = "work-card";
      card.innerHTML = `
        <img src="${w.main}" alt="${w.alt || ""}" loading="lazy">
        <div class="label">${w.title || ""}</div>
      `;
      card.addEventListener("click", () => openWorkModal(w));
      grid.appendChild(card);
    });
  }

  function openWorkModal(work){
    const modal = $("#workModal");
    const img = $("#workModalImg");
    if(!modal || !img) return;
    img.src = work.main;
    img.alt = work.alt || "";
    modal.classList.add("is-open");
  }

  function wireModalClose(){
    const modal = $("#workModal");
    if(!modal) return;
    modal.addEventListener("click", (e) => {
      // close by tapping backdrop; no close button
      if(e.target === modal){
        modal.classList.remove("is-open");
        const img = $("#workModalImg");
        if(img) img.src = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && modal.classList.contains("is-open")){
        modal.classList.remove("is-open");
        const img = $("#workModalImg");
        if(img) img.src = "";
      }
    });
  }

  function setFooterYear(){
    const el = $("#footerYear");
    if(!el) return;
    el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const urlLang = detectLangFromPath();
    const saved = localStorage.getItem("lang");
    const lang = (saved && SUPPORTED.includes(saved)) ? saved : urlLang;

    // ensure URL matches chosen language (complete sync)
    if(lang !== urlLang){
      gotoLang(lang);
      return;
    }

    const dict = await loadI18n();
    applyI18n(dict, lang);
    wireBrandHome();
    wireLangSelect(lang);
    buildDrawer(dict, lang);
    wireModalClose();
    setFooterYear();

    await renderWorks(dict, lang);

    // LOOKBOOK external link wiring (apply to all matching elements)
    const lbs = document.querySelectorAll("[data-lookbook-open]");
    if(lbs && lbs.length){
      const url = (dict.lookbook && dict.lookbook.externalUrl) ? dict.lookbook.externalUrl : "";
      if(url){
        lbs.forEach((a)=>{
          a.href = url;
          // External link behavior
          a.target = "_blank";
          a.rel = "noopener";
        });
      }
    }

    // CONTACT email wiring
    const emailLink = document.querySelector("[data-contact-email]");
    if(emailLink){
      const email = dict.contact?.email || "";
      if(email){
        emailLink.textContent = email;
        emailLink.href = `mailto:${email}`;
      }
    }

    // SNS icons wiring
    const ig = document.querySelector("[data-sns-instagram]");
    const tt = document.querySelector("[data-sns-tiktok]");
    if(ig) ig.href = dict.sns?.instagramUrl || "https://www.instagram.com/";
    if(tt) tt.href = dict.sns?.tiktokUrl || "https://www.tiktok.com/";
  });
})();
