// Informe de textos en inglés visibles que NO están en el diccionario (fr) -> revisión estática.
// uso: node untranslated.js pagina.html [--all]
const fs = require("fs"), vm = require("vm"), path = require("path");
const acorn = require("acorn");
const root = path.join(__dirname, "..", "Pivot-main");
const file = process.argv[2]; const showAll = process.argv.includes("--all");
const norm = (s) => s.replace(/\s+/g, " ").trim();
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "i18n-fr.js"), "utf8"), ctx);
const dict = ctx.window.PIVOT_I18N_DICT.fr;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tmpl = Object.keys(dict).filter((k) => /\{\w+\}/.test(k)).map((k) => new RegExp("^" + k.split(/(\{\w+\})/).map((p) => /^\{\w+\}$/.test(p) ? "(.+?)" : esc(p)).join("") + "$"));
function covered(c) {
  const k = norm(c.replace(/\{\}/g, "{x}"));
  if (dict[k] !== undefined) return true;
  const m = k.match(/^([^A-Za-z0-9{]*)(.*?)([\s:*…\.!?]*)$/);
  if (m && m[2] && dict[m[2]] !== undefined) return true;
  const sample = k;
  return tmpl.some((r) => r.test(sample) || (m && m[2] && r.test(m[2])));
}
const html = fs.readFileSync(path.join(root, file), "utf8");
const cands = new Map();
function add(text, line, kind) {
  let t = norm(text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&#39;/g, "'"));
  if (t.length < 2 || !/[A-Za-z]{2}/.test(t)) return;
  if (/^[\W\d_]*$/.test(t.replace(/\{\}/g, ""))) return;
  if (/^(https?:|\.\/|#|\.)/.test(t)) return;
  if (!cands.has(t)) cands.set(t, { line, kind });
}
function fromHtmlish(str, line) {
  // str con "{}" en lugar de ${...}
  const re = />([^<>]*)</g; let m;
  const wrapped = ">" + str + "<";
  while ((m = re.exec(wrapped))) add(m[1], line, "html");
  const ar = /\b(?:title|placeholder|aria-label|alt)="([^"]*)"/g;
  while ((m = ar.exec(str))) add(m[1], line, "attr");
  if (!/[<>]/.test(str)) add(str, line, "str");
}
const SKIP_CALLEES = new Set(["from", "select", "eq", "neq", "is", "in", "order", "or", "ilike", "rpc", "getItem", "setItem", "removeItem", "querySelector", "querySelectorAll", "getElementById", "addEventListener", "removeEventListener", "contains", "add", "remove", "toggle", "setAttribute", "getAttribute", "createElement", "closest", "matches", "hasAttribute", "removeAttribute", "log", "warn", "error", "info", "range", "gte", "lte", "not", "match", "split", "replace", "indexOf", "includes", "startsWith", "endsWith", "test", "join", "padStart", "padEnd", "append", "delete", "has", "get", "set", "require", "import", "createClient", "getPublicUrl", "download", "upload", "fetch", "open", "postMessage", "dispatchEvent", "Event", "createElementNS", "localeCompare", "push"]);
const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];
for (const sm of scripts) {
  const body = sm[1]; const off = html.slice(0, sm.index + sm[0].indexOf(body)).split("\n").length - 1;
  let ast;
  try { ast = acorn.parse(body, { ecmaVersion: 2022, locations: true, allowAwaitOutsideFunction: true }); } catch (e) { console.error("parse error", e.message); continue; }
  (function walk(n, parent, gp) {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "Literal" && typeof n.value === "string") {
      let skip = false;
      if (parent) {
        if (parent.type === "CallExpression" && parent.arguments.includes(n)) { const c = parent.callee; const nm = c.type === "MemberExpression" ? c.property.name : c.name; if (SKIP_CALLEES.has(nm)) skip = true; }
        if (parent.type === "Property" && parent.key === n) skip = true;
        if (parent.type === "BinaryExpression" && /^[!=]==?$/.test(parent.operator)) skip = true;
        if (parent.type === "SwitchCase") skip = true;
        if (parent.type === "MemberExpression" && parent.property === n) skip = true;
        if (parent.type === "NewExpression" && parent.arguments.includes(n)) skip = true;
        if (parent.type === "ImportDeclaration") skip = true;
      }
      const v = n.value;
      if (!skip) {
        if (!/[<>]/.test(v) && !v.includes(" ") && !/^[A-Z]/.test(v)) skip = true;
        if (/^[a-z][a-zA-Z0-9_\-:.]*$/.test(v)) skip = true;          // identificadores/clases
        if (/[;{}]|=>|^\s*(select|insert)/.test(v) && !/[<>]/.test(v)) skip = true; // css / sql
        if (/^[\w\-]+\s*:\s*[^ ]/.test(v) && /;/.test(v)) skip = true;
      }
      if (!skip) fromHtmlish(v, off + n.loc.start.line);
    } else if (n.type === "TemplateLiteral") {
      let s = n.quasis.map((q) => q.value.cooked).join("{}");
      let skip = false;
      if (parent && parent.type === "TaggedTemplateExpression") skip = true;
      if (parent && parent.type === "CallExpression" && parent.arguments.includes(n)) { const c = parent.callee; const nm = c.type === "MemberExpression" ? c.property.name : c.name; if (SKIP_CALLEES.has(nm)) skip = true; }
      if (/^\s*(select|insert)\b/i.test(s) || /^[\w\-.:,\s()*]*$/.test(s) && !/\s[A-Za-z]{3}/.test(s) && !/[<>]/.test(s)) skip = true;
      if (!skip) fromHtmlish(s, off + n.loc.start.line);
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && walk(c, n, parent)); else if (v && typeof v.type === "string") walk(v, n, parent);
    }
  })(ast, null, null);
}
// HTML estático (fuera de <script>)
const staticHtml = html.replace(/<script[\s\S]*?<\/script>/g, (m) => "\n".repeat(m.split("\n").length - 1)).replace(/<style[\s\S]*?<\/style>/g, (m) => "\n".repeat(m.split("\n").length - 1)).replace(/<!--[\s\S]*?-->/g, (m) => "\n".repeat(m.split("\n").length - 1));
{ const re = />([^<>]*)</g; let m; while ((m = re.exec(staticHtml))) add(m[1], staticHtml.slice(0, m.index).split("\n").length, "html");
  const ar = /\b(?:title|placeholder|aria-label|alt)="([^"]*)"/g; while ((m = ar.exec(staticHtml))) add(m[1], staticHtml.slice(0, m.index).split("\n").length, "attr");
  const t = html.match(/<title>([^<]*)<\/title>/); if (t) add(t[1], 1, "title"); }
let n = 0, miss = 0;
for (const [t, info] of [...cands.entries()].sort((a, b) => a[1].line - b[1].line)) {
  const ok = covered(t); n++; if (!ok) miss++;
  if (showAll || !ok) console.log(String(info.line).padStart(5), info.kind.padEnd(5), ok ? "OK " : "-- ", (process.env.FULL ? t : t.slice(0, 220)));
}
console.error(`${file}: ${n} candidatos, ${miss} sin traducir`);
