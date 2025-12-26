(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);

  const SUPPORTED = ["ja","en","es","fr","ko","zh-hans"];
  const DEFAULT_LANG = "ja";

  function detectLangFromPath(){
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return SUPPORTED.includes(seg) ? seg : "ja";
  }

  async function loadNews(){
    const res = await fetch("/assets/data/news.json", { cache: "no-store" });
    if(!res.ok) return { news: [] };
    return await res.json();
  }

  function pickLang(obj, lang){
    if(!obj) return "";
    return obj[lang] ?? obj[DEFAULT_LANG] ?? "";
  }

  // /posts/<slug>/ を想定（必要なら post.html?id=xxx に変更可）
  function getSlugFromPath(){
    const parts = location.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("posts");
    if(i >= 0 && parts[i+1]) return parts[i+1];
    return null;
  }

  function fmtDate(iso){
    if(!iso) return "";
    // 表示だけ：2026-01-15 → 2026.01.15
    return iso.replaceAll("-", ".");
  }

  async function renderNewsList(){
    const mount = $("#newsList");
    if(!mount) return;

    const lang = detectLangFromPath();
    const data = await loadNews();
    const items = Array.isArray(data.news) ? data.news : [];

    if(items.length === 0){
      mount.innerHTML = `<div class="card"><p data-i18n="news.empty"></p></div>`;
      return;
    }

    // 新しい順
    items.sort((a,b)=> String(b.date||"").localeCompare(String(a.date||"")));

    mount.innerHTML = "";
    items.forEach(n => {
      const title = pickLang(n.title, lang);
      const excerpt = pickLang(n.excerpt, lang);
      const href = `/posts/${n.id}/`; // ここは運用ルールとして固定

      const a = document.createElement("a");
      a.className = "tile";
      a.href = href;
      a.innerHTML = `
        <div class="tile-inner">
          <h2 class="tile-title">${title}</h2>
          <p class="tile-hint">${fmtDate(n.date)} ${excerpt ? "— " + excerpt : ""}</p>
        </div>
      `;
      mount.appendChild(a);
    });
  }

  async function renderNewsPost(){
    const slug = getSlugFromPath();
    if(!slug) return;

    const titleEl = $("#newsTitle");
    const metaEl  = $("#newsMeta");
    const bodyEl  = $("#newsBody");
    if(!titleEl || !metaEl || !bodyEl) return;

    const lang = detectLangFromPath();
    const data = await loadNews();
    const items = Array.isArray(data.news) ? data.news : [];
    const n = items.find(x => x.id === slug);

    if(!n){
      titleEl.textContent = "NOT FOUND";
      metaEl.textContent = "";
      bodyEl.innerHTML = `<div class="card"><p>news not found</p></div>`;
      return;
    }

    titleEl.textContent = pickLang(n.title, lang);
    metaEl.textContent  = fmtDate(n.date);

    // body は HTML 文字列で持つ（太字/改行/リンクなど自由）
    bodyEl.innerHTML = pickLang(n.body, lang) || "";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await renderNewsList();
    await renderNewsPost();
  });
})();
