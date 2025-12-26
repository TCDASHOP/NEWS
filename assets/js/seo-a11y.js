/* =========================================================
   SEO/A11y helper (no visual change)
   - Adds aria-label to icon-only links so Lighthouse doesn't
     treat them as "empty links".
   - Adds rel="noopener noreferrer" to external links when
     target=_blank is used (or when rel is missing).
   ========================================================= */

(function () {
  function guessLabelFromHref(href) {
    try {
      var u = new URL(href, window.location.origin);
      var host = (u.hostname || "").toLowerCase();
      var path = (u.pathname || "/").toLowerCase();

      // External socials / shop
      if (host.includes("instagram.com")) return "Instagram";
      if (host.includes("tiktok.com")) return "TikTok";
      if (host.includes("tcda.shop")) return "SHOP";

      // Site pages (adjust to your actual routes if needed)
      if (path === "/" || path.endsWith("/index.html")) return "HOME";
      if (path.endsWith("/works.html") || path.includes("/works/")) return "WORKS";
      if (path.endsWith("/lookbook.html") || path.includes("/lookbook/")) return "LOOKBOOK";
      if (path.endsWith("/about.html") || path.includes("/about/")) return "ABOUT";
      if (path.endsWith("/sns.html") || path.includes("/sns/")) return "SNS";
      if (path.endsWith("/contact.html") || path.includes("/contact/")) return "CONTACT";
      if (path.endsWith("/license.html") || path.includes("/license/")) return "LICENSE";
    } catch (e) {}
    return "";
  }

  function textContentTrimmed(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll("a[href]");
    links.forEach(function (a) {
      // 1) External link hardening: rel for target=_blank
      var isBlank = (a.getAttribute("target") || "").toLowerCase() === "_blank";
      if (isBlank) {
        var rel = (a.getAttribute("rel") || "");
        if (!/noopener/i.test(rel) || !/noreferrer/i.test(rel)) {
          var merged = (rel + " noopener noreferrer").trim().replace(/\s+/g, " ");
          a.setAttribute("rel", merged);
        }
      }

      // 2) Skip if it already has an accessible name
      if (a.hasAttribute("aria-label")) return;
      if (a.getAttribute("title")) return;
      if (textContentTrimmed(a).length > 0) return;

      // 3) Try to label from contained images
      var img = a.querySelector("img[alt]");
      if (img) {
        var alt = (img.getAttribute("alt") || "").trim();
        if (alt.length > 0) {
          a.setAttribute("aria-label", alt);
          return;
        }
      }

      // 4) Guess from href
      var label = guessLabelFromHref(a.href);
      if (label) a.setAttribute("aria-label", label);
    });
  });
})();
