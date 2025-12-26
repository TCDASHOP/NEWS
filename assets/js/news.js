(() => {
  const LANGS = ["ja","en","es","fr","ko","zh-hans"];
  const DEFAULT_LANG = "ja";

  const i18n = {
    "title.news": {
      ja: "NEWS",
      en: "NEWS",
      es: "NOTICIAS",
      fr: "ACTUALITÉS",
      ko: "뉴스",
      "zh-hans": "新闻"
    },
    "lead": {
      ja: "コラボ、個展、展覧会、公開情報をまとめます。",
      en: "Updates on collaborations, exhibitions, and events.",
      es: "Actualizaciones sobre colaboraciones, exposiciones y eventos.",
      fr: "Actualités sur les collaborations, expositions et événements.",
      ko: "콜라보, 전시, 이벤트 소식을 모읍니다.",
      "zh-hans": "汇总合作、展览与活动更新。"
    },
    "empty": {
      ja: "まだNEWSはありません。今後ここに、コラボ・個展・展覧会のお知らせを追加します。",
      en: "No news yet. Upcoming collaborations, exhibitions, and event updates will appear here.",
      es: "Aún no hay noticias. Aquí aparecerán próximas colaboraciones, exposiciones y eventos.",
      fr: "Aucune actualité pour le moment. Les mises à jour apparaîtront ici.",
      ko: "아직 뉴스가 없습니다. 앞으로 이곳에 소식이 추가됩니다.",
      "zh-hans": "目前暂无内容。后续更新将发布在这里。"
    },
    "badge.collab": {
      ja: "COLLAB",
      en: "COLLAB",
      es: "COLAB",
      fr: "COLLAB",
      ko: "콜라보",
      "zh-hans": "合作"
    },
    "badge.exhibition": {
      ja: "EXHIBITION",
      en: "EXHIBITION",
      es: "EXPOSICIÓN",
      fr: "EXPOSITION",
      ko: "전시",
      "zh-hans": "展览"
    },
    "badge.event": {
      ja: "EVENT",
      en: "EVENT",
      es: "EVENTO",
      fr: "ÉVÉNEMENT",
      ko: "이벤트",
      "zh-hans": "活动"
    }
  };

  const $ = (id) => document.getElementById(id);

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

    $("pageTitle").textContent = t("title.news", lang);
    $("h1").textContent = t("title.news", lang);
    $("lead").textContent = t("lead", lang);
  }

  function t(key, lang) {
    const obj = i18n[key];
    if (!obj) return key;
    return obj[lang] || obj[DEFAULT_LANG] || key;
  }

  function pickLocalized(v, lang) {
    // v が {ja:"",en:""} でも "string" でもOKにする
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v[lang] || v[DEFAULT_LANG] || "";
    return "";
  }

  function badgeText(type, lang) {
    const k = `badge.${type || ""}`.toLowerCase();
    if (i18n[k]) return t(k, lang);
    // 未知typeはそのまま
    return (type || "").toUpperCase();
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

  function normalizeItems(raw) {
    // raw は配列想定。違っても崩れないように。
    if (!Array.isArray(raw)) return [];
    return raw
      .map(it => ({
        slug: it.slug || it.id || "",
        date: it.date || "",
        type: (it.type || "news").toLowerCase(),
        title: it.title,
        summary: it.summary,
        ogImage: it.ogImage || "",
        externalUrl: it.externalUrl || ""
      }))
      .filter(it => it.slug);
  }

  function postUrl(item) {
    // 記事は /posts/{slug}/ に統一
    if (item.externalUrl) return item.externalUrl;
    return `/posts/${encodeURIComponent(item.slug)}/`;
  }

  async function load() {
    const lang = getLang();
    setLang(lang);
    $("y").textContent = String(new Date().getFullYear());

    try {
      const res = await fetch("/data/news.json", { cache: "no-store" });
      const raw = await res.json();
      const items = normalizeItems(raw).sort((a,b) => (b.date || "").localeCompare(a.date || ""));

      const list = $("newsList");
      list.innerHTML = "";

      if (items.length === 0) {
        const empty = $("emptyState");
        empty.textContent = t("empty", lang);
        empty.style.display = "block";
        return;
      }

      $("emptyState").style.display = "none";

      for (const item of items) {
        const a = document.createElement("a");
        a.className = "card";
        a.href = postUrl(item);
        if (item.externalUrl) a.target = "_blank", a.rel = "noopener";

        const meta = document.createElement("div");
        meta.className = "meta";

        const badge = document.createElement("span");
        badge.className = "badge";
        // type は collab / exhibition / event を推奨
        badge.textContent = badgeText(item.type, lang);

        const date = document.createElement("span");
        date.textContent = formatDate(item.date, lang);

        meta.appendChild(badge);
        meta.appendChild(date);

        const h3 = document.createElement("h3");
        h3.className = "title";
        h3.textContent = pickLocalized(item.title, lang) || "(untitled)";

        const p = document.createElement("p");
        p.className = "summary";
        p.textContent = pickLocalized(item.summary, lang);

        a.appendChild(meta);
        a.appendChild(h3);
        if (p.textContent) a.appendChild(p);

        list.appendChild(a);
      }
    } catch (e) {
      const empty = $("emptyState");
      empty.textContent = "news.json を読み込めませんでした。/data/news.json の存在とJSON形式を確認してください。";
      empty.style.display = "block";
      console.error(e);
    }
  }

  // language select
  window.addEventListener("DOMContentLoaded", () => {
    const sel = $("langSelect");
    sel.addEventListener("change", () => {
      const lang = sel.value;
      localStorage.setItem("sca_news_lang", lang);

      // URLにlangを付けて再描画（共有もしやすい）
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState({}, "", url.toString());
      load();
    });

    load();
  });
})();
