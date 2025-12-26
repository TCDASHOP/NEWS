(() => {
  const LANGS = ["ja","en","es","fr","ko","zh-hans"];
  const DEFAULT_LANG = "ja";

  const i18n = {
    h1: { ja:"NEWS", en:"NEWS", es:"NOTICIAS", fr:"ACTUALITÉS", ko:"뉴스", "zh-hans":"新闻" },
    lead: {
      ja:"コラボ、個展、展覧会、公開情報をまとめます。",
      en:"Updates on collaborations, exhibitions, and events.",
      es:"Actualizaciones sobre colaboraciones, exposiciones y eventos.",
      fr:"Actualités sur les collaborations, expositions et événements.",
      ko:"콜라보, 전시, 이벤트 소식을 모읍니다.",
      "zh-hans":"汇总合作、展览与活动更新。"
    },
    empty: {
      ja:"まだNEWSはありません。今後ここに、コラボ・個展・展覧会のお知らせを追加します。",
      en:"No news yet. Upcoming updates will appear here.",
      es:"Aún no hay noticias. Próximas actualizaciones aparecerán aquí.",
      fr:"Aucune actualité pour le moment. Les mises à jour apparaîtront ici.",
      ko:"아직 뉴스가 없습니다. 앞으로 이곳에 소식이 추가됩니다.",
      "zh-hans":"目前暂无内容，后续更新将发布在这里。"
    }
  };

  const $ = (id) => document.getElementById(id);

  function getLang() {
    const url = new URL(location.href);
    const q = (url.searchParams.get("lang") || "").toLowerCase();
    const stored = (localStorage.getItem("sca_news_lang") || "").toLowerCase();
    const lang = q || stored || DEFAULT_LANG;
    return LANGS.includes(lang) ? lang : DEFAULT_LANG;
  }

  function setLang(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem("sca_news_lang", lang);
    const sel = $("langSelect");
    if (sel) sel.value = lang;
    $("h1").textContent = i18n.h1[lang] || i18n.h1[DEFAULT_LANG];
    $("lead").textContent = i18n.lead[lang] || i18n.lead[DEFAULT_LANG];
  }

  function pick(v, lang) {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v[lang] || v[DEFAULT_LANG] || "";
  }

  function postUrl(item){
    return item.externalUrl ? item.externalUrl : `/posts/${encodeURIComponent(item.slug)}/?lang=${encodeURIComponent(getLang())}`;
  }

  async function load(){
    const lang = getLang();
    setLang(lang);
    $("y").textContent = String(new Date().getFullYear());

    try{
      const res = await fetch("/data/news.json", { cache:"no-store" });
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : [];

      const list = $("newsList");
      list.innerHTML = "";

      if (items.length === 0) {
        const empty = $("emptyState");
        empty.style.display = "block";
        empty.textContent = i18n.empty[lang] || i18n.empty[DEFAULT_LANG];
        return;
      }

      $("emptyState").style.display = "none";

      items
        .sort((a,b)=>(String(b.date||"")).localeCompare(String(a.date||"")))
        .forEach(item=>{
          const a = document.createElement("a");
          a.className = "news-card";
          a.href = postUrl(item);
          if (item.externalUrl) a.target = "_blank", a.rel="noopener";

          const meta = document.createElement("div");
          meta.className = "news-meta";
          meta.textContent = item.date || "";

          const h = document.createElement("h3");
          h.className = "news-title";
          h.textContent = pick(item.title, lang) || "(untitled)";

          const p = document.createElement("p");
          p.className = "news-summary";
          p.textContent = pick(item.summary, lang);

          a.appendChild(meta);
          a.appendChild(h);
          if (p.textContent) a.appendChild(p);

          list.appendChild(a);
        });

    }catch(e){
      const empty = $("emptyState");
      empty.style.display = "block";
      empty.textContent = "news.json を読み込めませんでした。/data/news.json の存在とJSON形式を確認してください。";
      console.error(e);
    }
  }

  window.addEventListener("DOMContentLoaded", ()=>{
    const sel = $("langSelect");
    if (sel) {
      sel.addEventListener("change", ()=>{
        const lang = sel.value;
        localStorage.setItem("sca_news_lang", lang);
        const url = new URL(location.href);
        url.searchParams.set("lang", lang);
        history.replaceState({}, "", url.toString());
        load();
      });
    }
    load();
  });
})();
