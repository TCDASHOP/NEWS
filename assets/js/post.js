(() => {
  const LANGS = ["ja","en","es","fr","ko","zh-hans"];
  const DEFAULT_LANG = "ja";

  const i18n = {
    "page.news": { ja:"NEWS", en:"NEWS", es:"NOTICIAS", fr:"ACTUALITÉS", ko:"뉴스", "zh-hans":"新闻" },
    "badge.collab": { ja:"COLLAB", en:"COLLAB", es:"COLAB", fr:"COLLAB", ko:"콜라보", "zh-hans":"合作" },
    "badge.exhibition": { ja:"EXHIBITION", en:"EXHIBITION", es:"EXPOSICIÓN", fr:"EXPOSITION", ko:"전시", "zh-hans":"展览" },
    "badge.event": { ja:"EVENT", en:"EVENT", es:"EVENTO", fr:"ÉVÉNEMENT", ko:"이벤트", "zh-hans":"活动" }
  };

  const $ = (id) => document.getElementById(id);

  function t(key, lang) {
    const obj = i18n[key];
    if (!obj) return key;
    return obj[lang] || obj[DEFAULT_LANG] || key;
  }

  function getLang() {
    const url = new URL(location.href);
    const q = url.searchParams.get("lang");
    const stored = localStorage.getItem("sca_news_lang");
    const lang = (q || stored || DEFAULT_LANG).toLowerCase();
    return LANGS.includes(lang) ? lang : DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem("sca_news_lang", lang);
    document.documentElement.lang = lang;
    $("langSelect").value = lang;
    $("pageTitle").textContent = t("page.news", lang);
  }

  function pickLocalized(v, lang) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v[lang] || v[DEFAULT_LANG] || "";
    return "";
  }

  function formatDate(iso, lang) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const locale =
      lang === "zh-hans" ? "zh-Hans" :
      lang === "ko" ? "ko-KR" :
      lang === "fr" ? "fr-FR" :
      lang === "es" ? "es-ES" :
      lang === "en" ? "en-US" : "ja-JP";
    return new Intl.DateTimeFormat(locale, { year:"numeric", month:"short", day:"2-digit" }).format(d);
  }

  function badgeText(type, lang) {
    const key = `badge.${(type || "").toLowerCase()}`;
    if (i18n[key]) return t(key, lang);
    return (type || "").toUpperCase();
  }

  function render() {
    const lang = getLang();
    setLang(lang);
    $("y").textContent = String(new Date().getFullYear());

    const dataEl = $("postData");
    if (!dataEl) return;

    let post;
    try { post = JSON.parse(dataEl.textContent); }
    catch { post = {}; }

    $("h1").textContent = pickLocalized(post.title, lang) || "(untitled)";
    $("sub").textContent = pickLocalized(post.summary, lang) || "";

    $("badge").textContent = badgeText(post.type, lang);
    $("date").textContent = formatDate(post.date, lang);

    const html = pickLocalized(post.bodyHtml, lang);
    $("body").innerHTML = html || "<p class='muted'>No content.</p>";
  }

  window.addEventListener("DOMContentLoaded", () => {
    const sel = $("langSelect");
    sel.addEventListener("change", () => {
      const lang = sel.value;
      localStorage.setItem("sca_news_lang", lang);
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState({}, "", url.toString());
      render();
    });

    render();
  });
})();
