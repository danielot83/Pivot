/* PlayPivot — i18n (EN / FR / ES)
 *
 * Idea: el inglés es el idioma "fuente". El HTML y el JS siguen escritos en
 * inglés, y cada texto se busca en el diccionario del idioma elegido
 * (i18n-fr.js / i18n-es.js). Si no hay traducción, se queda en inglés.
 *
 *  - Textos del HTML: se traducen solos (nodos de texto, y los atributos
 *    title / placeholder / aria-label / alt) al cargar la página.
 *  - Textos que el JavaScript pinta después (tablas, popups, mensajes): un
 *    MutationObserver traduce los nodos nuevos con el mismo diccionario.
 *  - Claves con huecos: "{n} players" sirve para "12 players" (plantillas).
 *  - alert / confirm / prompt también pasan por el diccionario.
 *  - Fechas: toLocaleDateString & co. usan el idioma elegido.
 *  - Textos que no son DOM (PDF, Excel, canvas): _t("English text", {vars}).
 *  - Fragmentos de HTML con etiquetas dentro de un texto: data-i18n-html en el
 *    elemento (la clave es su innerHTML normalizado), o _tHtml(`...`).
 *  - Zonas con contenido de usuario que NO se deben traducir: data-i18n-skip.
 *
 * Solo hay una base de datos: lo que crea la gente no se traduce nunca, y los
 * valores guardados (estados, categorías...) no cambian. Aquí solo se cambia
 * lo que se MUESTRA.
 *
 * Cambiar de idioma guarda la elección y recarga la página (así el contenido
 * ya cargado de la base de datos nunca pasa por el traductor).
 */
(function () {
  var VERSION = 2;   // súbelo al cambiar un diccionario (evita la caché)
  var LANGS = ["en", "fr", "es"];
  var LOCALES = { en: undefined, fr: "fr-FR", es: "es-ES" };
  var STORAGE_KEY = "pivot_lang";
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1, SVG: 1, svg: 1 };
  var ATTRS = ["title", "placeholder", "aria-label", "alt", "label"];

  function detect() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && LANGS.indexOf(saved) !== -1) return saved;
    var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) !== -1 ? nav : "en";
  }

  var lang = detect();
  var dict = {};          // se rellena con window.PIVOT_I18N_DICT[lang]
  var missing = {};
  var debug = /[?&]i18n_debug=1/.test(location.search);

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // Plantillas: claves con {huecos}. Se compilan una vez a expresiones regulares.
  var templates = null;
  // Huecos que son siempre números ({n} partidos...): así "New match" no encaja con "{n} match"
  // (acierto falso que daba "New partido"). El resto de huecos ({name}, {team}...) aceptan cualquier texto.
  var NUMERIC_NAMES = { n: 1, k: 1, i: 1, total: 1, done: 1, number: 1 };
  function buildTemplates() {
    templates = [];
    Object.keys(dict).forEach(function (k) {
      if (!/\{\w+\}/.test(k)) return;
      var names = [];
      var re = "^" + k.split(/(\{\w+\})/).map(function (part) {
        var m = part.match(/^\{(\w+)\}$/);
        if (m) { names.push(m[1]); return NUMERIC_NAMES[m[1]] ? "(#?\\d[\\d.,:%\\/×+\\-–]*)" : "(.+?)"; }
        return esc(part);
      }).join("") + "$";
      templates.push({ key: k, re: new RegExp(re), names: names });
    });
    // las más largas (más específicas) primero
    templates.sort(function (a, b) { return b.key.length - a.key.length; });
  }
  function fromTemplate(text) {
    if (!templates) buildTemplates();
    for (var i = 0; i < templates.length; i++) {
      var m = text.match(templates[i].re);
      if (m) {
        var vars = {};
        // los valores capturados que ya son una clave del diccionario (p. ej. "Points") también se traducen
        templates[i].names.forEach(function (n, j) { var cv = m[j + 1], tv = direct(cv); vars[n] = tv !== undefined ? tv : cv; });
        var out = dict[templates[i].key];
        if (out) return fill(out, vars);
      }
    }
    return undefined;
  }

  function direct(key) {
    var v = dict[key];
    return v === undefined || v === "" ? undefined : v;
  }

  // Busca una traducción: exacta -> sin adornos (⚠ ✓ + ← … : *) -> plantilla.
  function find(core) {
    var v = direct(core);
    if (v !== undefined) return v;
    // 0) símbolo suelto + espacio al principio ("⚠ ", "✓ ", "← "): "⚠ #7 is..." -> "#7 is..."
    var sym = core.match(/^([^A-Za-z0-9{#"«(]+?\s+)(.+)$/);
    if (sym) {
      var s0 = direct(sym[2]);
      if (s0 === undefined) s0 = fromTemplate(sym[2]);
      if (s0 !== undefined) return sym[1] + s0;
    }
    var m = core.match(/^([^A-Za-z0-9{]*)(.*?)([\s:*…\.!?]*)$/);
    if (m && m[2]) {
      // 1) quitando solo el adorno del principio (⚠ ✓ + ←): "⚠ Texto." -> "Texto."
      var lead = m[1], rest = m[2] + m[3];
      if (lead) {
        var a = direct(rest);
        if (a === undefined) a = fromTemplate(rest);
        if (a !== undefined) return lead + a;
      }
      // 2) quitando también el final (: * … . ! ?): "Team:" -> "Team"
      if (m[3]) {
        var b = direct(m[2]);
        if (b === undefined) b = fromTemplate(m[2]);
        if (b !== undefined) return lead + b + m[3];
      }
    }
    var ft = fromTemplate(core);
    if (ft !== undefined) return ft;
    // "Mensaje fijo: detalle dinámico" ("Couldn't load your teams: <error>"): se traduce el inicio si "Mensaje fijo:" es una clave
    var ci = core.indexOf(": ");
    if (ci > 3) { var hv = direct(core.slice(0, ci + 1)); if (hv !== undefined) return hv + core.slice(ci + 1); }
    return fromList(core);
  }

  // Listas unidas por ", " / " · " / " — " ("Passing, Fast break", "Senior · Female — 2026-2027"):
  // se traduce cada trozo que sea una clave del diccionario; si ninguno lo es, no se toca.
  function fromList(core) {
    if (!/(, | · | — | \/ |; )/.test(core)) return undefined;
    var parts = core.split(/(, | · | — | \/ |; )/), changed = false;
    for (var i = 0; i < parts.length; i += 2) {
      var v = direct(parts[i]);
      if (v === undefined) v = fromTemplate(parts[i]);
      if (v !== undefined && v !== parts[i]) { parts[i] = v; changed = true; }
    }
    return changed ? parts.join("") : undefined;
  }

  function lookup(key) {
    var v = find(key);
    if (v === undefined) {
      if (lang !== "en" && /[A-Za-z]{2}/.test(key)) { missing[key] = 1; if (debug) console.warn("[i18n missing:" + lang + "]", key); }
      return key;
    }
    return v;
  }

  function fill(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined || vars[k] === null ? m : vars[k]; });
  }

  // _t("English text", {vars})
  // Contexto opcional tras "||": _t("E||event letter in the PDF header") devuelve
  // "E" en inglés; en otro idioma busca la clave completa (para que la misma
  // palabra/letra pueda traducirse distinto según el sitio).
  function t(key, vars) {
    if (typeof key !== "string") return String(key);   // _t(undefined) debe comportarse como `${undefined}`, no romper
    var cut = key.indexOf("||");
    var plain = cut === -1 ? key : key.slice(0, cut);
    if (lang === "en") return fill(plain, vars);
    var k = norm(key);
    var d = direct(k);
    if (d !== undefined) return fill(d, vars);
    if (cut !== -1) { var d2 = direct(norm(plain)); return fill(d2 !== undefined ? d2 : plain, vars); }
    return fill(lookup(k), vars);
  }

  function translateTextNode(node) {
    var raw = node.nodeValue;
    if (node.__i18n === raw) return;            // ya es nuestra traducción
    var core = norm(raw);
    if (!core || !/[A-Za-z]/.test(core)) return;
    var out = lookup(core);
    if (out === core) return;
    var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    node.nodeValue = node.__i18n = lead + out + trail;
  }

  function translateTree(root) {
    if (lang === "en" || !root) return;
    var nodes = [];
    (function walk(n) {
      if (n.nodeType === 3) { nodes.push(n); return; }
      if (n.nodeType !== 1) { if (n.nodeType === 11 || n.nodeType === 9) { for (var c0 = n.firstChild; c0; c0 = c0.nextSibling) walk(c0); } return; }
      if (SKIP_TAGS[n.tagName] || n.hasAttribute("data-i18n-skip")) return;
      if (n.hasAttribute("data-i18n-html")) {
        var k = norm(n.innerHTML), v = lookup(k);
        if (v !== k) n.innerHTML = v;
        return;
      }
      for (var i = 0; i < ATTRS.length; i++) translateAttr(n, ATTRS[i]);
      if (n.tagName === "INPUT" && /^(button|submit)$/i.test(n.type) && n.value) { var nv = lookup(norm(n.value)); if (nv !== norm(n.value)) n.value = nv; }
      for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
    })(root);
    nodes.forEach(translateTextNode);
  }

  // Para plantillas de HTML (strings) con texto estático: devuelve el HTML traducido.
  function tHtml(html) {
    if (lang === "en") return html;
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    translateTree(tpl.content);
    return tpl.innerHTML;
  }

  function setLang(l) {
    if (LANGS.indexOf(l) === -1 || l === lang) return;
    try { localStorage.setItem(STORAGE_KEY, l); } catch (e) {}
    location.reload();
  }

  function mountSwitcher() {
    if (document.getElementById("pivot-lang-switch")) return;
    var box = document.createElement("div");
    box.id = "pivot-lang-switch";
    box.setAttribute("data-i18n-skip", "");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Language");
    LANGS.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = l.toUpperCase(); b.dataset.lang = l;
      b.title = { en: "English", fr: "Français", es: "Español" }[l];
      if (l === lang) b.className = "active";
      b.addEventListener("click", function () { setLang(l); });
      box.appendChild(b);
    });
    var tr = document.querySelector(".topbar-right");
    var mt = document.querySelector(".mobile-topbar");
    if (tr) { box.className = "pivot-lang-inline"; tr.insertBefore(box, tr.firstChild); }
    else if (mt) { box.className = "pivot-lang-inline"; mt.appendChild(box); }
    else { box.className = "pivot-lang-floating"; document.body.appendChild(box); }
    // En móvil la barra superior normal (.topbar) puede estar oculta: duplicamos en la barra móvil.
    if (tr && mt && !mt.querySelector(".pivot-lang-inline")) {
      var clone = box.cloneNode(true); clone.id = "pivot-lang-switch-m"; clone.classList.add("pivot-lang-mobile");
      clone.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.lang); }); });
      mt.appendChild(clone);
    }
  }

  function injectStyle() {
    if (document.getElementById("pivot-lang-style")) return;
    var st = document.createElement("style");
    st.id = "pivot-lang-style";
    st.textContent =
      ".pivot-lang-inline,.pivot-lang-floating{display:inline-flex;border:1px solid var(--line,#e5e5e5);border-radius:100px;overflow:hidden;background:var(--card,#fff);font-family:inherit}" +
      ".pivot-lang-floating{position:fixed;top:12px;right:12px;z-index:9999}" +
      ".pivot-lang-inline button,.pivot-lang-floating button{border:none;background:none;width:auto;margin:0;border-radius:0;line-height:1.2;transition:none;padding:6px 10px;font-size:12.5px;font-weight:700;letter-spacing:.03em;color:var(--muted,#6b6b70);cursor:pointer;font-family:inherit}" +
      ".pivot-lang-inline button+button,.pivot-lang-floating button+button{border-left:1px solid var(--line,#e5e5e5)}" +
      ".pivot-lang-inline button:hover,.pivot-lang-floating button:hover{background:var(--paper,#fafafa)}" +
      ".pivot-lang-inline button.active,.pivot-lang-floating button.active{background:var(--accent-tint,#fdefe7);color:var(--accent-deep,#b85012)}" +
      ".mobile-topbar .pivot-lang-inline{margin-left:auto}" +
      ".pivot-lang-mobile{display:none!important}" +
      "@media (max-width:900px){.mobile-topbar .pivot-lang-mobile{display:inline-flex!important;margin-left:auto}.topbar-right .pivot-lang-inline:not(.pivot-lang-mobile){display:none}}";
    document.head.appendChild(st);
  }

  function skipped(n) {
    for (var e = n.nodeType === 1 ? n : n.parentNode; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP_TAGS[e.tagName] || e.hasAttribute("data-i18n-skip")) return true;
    }
    return false;
  }

  function translateAttr(el, name) {
    var a = el.getAttribute(name);
    if (!a || el.__i18nAttr && el.__i18nAttr[name] === a) return;
    var na = lookup(norm(a));
    if (na !== norm(a)) { el.setAttribute(name, na); (el.__i18nAttr = el.__i18nAttr || {})[name] = na; }
  }

  function observe() {
    if (lang === "en" || !window.MutationObserver) return;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.type === "childList") {
          for (var j = 0; j < r.addedNodes.length; j++) {
            var n = r.addedNodes[j];
            if (n.id === "pivot-lang-switch" || skipped(n)) continue;
            if (n.nodeType === 3) translateTextNode(n); else if (n.nodeType === 1) translateTree(n);
          }
        } else if (r.type === "characterData") {
          if (r.target.nodeType === 3 && !skipped(r.target)) translateTextNode(r.target);
        } else if (r.type === "attributes") {
          if (!skipped(r.target)) translateAttr(r.target, r.attributeName);
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // alert / confirm / prompt: el mensaje pasa por el diccionario
  function patchDialogs() {
    ["alert", "confirm", "prompt"].forEach(function (name) {
      var orig = window[name];
      window[name] = function (msg, def) { return orig.call(window, msg == null ? msg : t(String(msg)), def); };
    });
  }

  // Fechas y horas en el idioma elegido (cuando el código no fija uno distinto
  // del inglés, p. ej. toLocaleDateString(undefined) o "en-US").
  function patchDates() {
    var loc = LOCALES[lang];
    if (!loc) return;
    ["toLocaleDateString", "toLocaleString", "toLocaleTimeString"].forEach(function (fn) {
      var orig = Date.prototype[fn];
      Date.prototype[fn] = function (l, o) { return orig.call(this, (l === undefined || /^en(-|$)/.test(l)) ? loc : l, o); };
    });
  }

  // Se llama justo después de cargar el diccionario (ver más abajo).
  function start() {
    var d = (window.PIVOT_I18N_DICT || {})[lang];
    if (d) dict = d;
    templates = null;
    document.documentElement.setAttribute("lang", lang);
    injectStyle();
    patchDialogs();
    patchDates();
    translateTree(document.body);
    if (lang !== "en" && document.title) { var tt = document.title; var nt = lookup(norm(tt)); if (nt !== norm(tt)) document.title = nt; }
    mountSwitcher();
    var sw = document.getElementById("pivot-lang-switch"); if (sw && lang !== "en") sw.setAttribute("aria-label", lookup("Language"));
    observe();
  }

  window.pivotI18n = {
    langs: LANGS,
    get lang() { return lang; },
    locale: function () { return LOCALES[lang]; },
    t: t, tHtml: tHtml, translateTree: translateTree, setLang: setLang, start: start,
    missing: function () { return Object.keys(missing); },
    // diagnóstico (tools/tplhits.js): ¿por qué vía se traduce un texto? "direct" | "tpl:<clave>" | "none"
    via: function (text) {
      var s = norm(text); if (direct(s) !== undefined) return "direct";
      if (!templates) buildTemplates();
      for (var i = 0; i < templates.length; i++) { if (templates[i].re.test(s)) return "tpl:" + templates[i].key; }
      return "none";
    },
  };
  window._t = t;
  window._tHtml = tHtml;
  // PDFs (jsPDF): envuelve doc.text para que los textos fijos y las plantillas
  // ("Total: 45 min") salgan en el idioma elegido. En inglés no hace nada.
  window._pdf = function (doc) {
    if (lang === "en" || !doc || doc.__i18nPdf) return doc;
    var orig = doc.text;
    doc.text = function (s) {
      var a = Array.prototype.slice.call(arguments);
      if (typeof s === "string") a[0] = t(s);
      else if (Array.isArray(s)) a[0] = s.map(function (x) { return typeof x === "string" ? t(x) : x; });
      return orig.apply(doc, a);
    };
    doc.__i18nPdf = true;
    return doc;
  };
  window.PIVOT_LOCALE = LOCALES[lang];

  // Carga el diccionario del idioma elegido (solo ese) y arranca. Se usa
  // document.write para que el diccionario esté listo ANTES de que corran los
  // scripts de la página (que van después de este <script>).
  if (lang === "en") { start(); }
  else {
    document.write('<script src="./i18n-' + lang + '.js?v=' + VERSION + '"><\/script><script>pivotI18n.start()<\/script>');
  }
})();
