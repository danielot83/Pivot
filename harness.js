// Carga una página en un idioma (sin Supabase real) y devuelve el navegador/página.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const defRoot = process.env.PIVOT_ROOT || path.join(__dirname, "..", "Pivot-main");
const mime = (f) => f.endsWith(".js") ? "application/javascript" : f.endsWith(".html") ? "text/html" : f.endsWith(".png") ? "image/png" : "application/octet-stream";
const SUPA_STUB = `
 window.__DB = window.__DB || {};
 window.supabase = { createClient: () => ({
  auth: { getSession: async()=>({data:{session: window.__NOSESSION ? null : {user:{id:"u1"}}}}), getUser: async()=>({data:{user:{id:"u1"}}}), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}), signOut: async()=>({}) },
  storage: { from: () => ({ getPublicUrl: ()=>({data:{publicUrl:""}}), upload: async()=>({}) }) },
  rpc(name, args) { if (args !== undefined) (window.__WRITES=window.__WRITES||[]).push(["rpc", name, JSON.parse(JSON.stringify(args))]); const r = this.from("rpc:" + name); return r; },
  from(table) { const f={eq:[],is:[],in:[],neq:[]}; let range=null; let single=false;
    const b={select(){return b},order(){return b},limit(){return b},or(){return b},ilike(){return b},not(){return b},gte(){return b},lte(){return b},
      eq(c,v){f.eq.push([c,v]);return b},neq(c,v){f.neq.push([c,v]);return b},is(c,v){f.is.push([c,v]);return b},in(c,v){f.in.push([c,v]);return b},range(a,z){range=[a,z];return b},
      maybeSingle(){single=true;return b}, single(){single=true;return b},
      insert(p){(window.__WRITES=window.__WRITES||[]).push(["insert",table,JSON.parse(JSON.stringify(p===undefined?null:p))]);window.__N=(window.__N||0)+1;f.ins=(Array.isArray(p)?p:[p]).map((r,i)=>({id:"new"+window.__N+"_"+i,translation_group_id:"g"+window.__N,...r}));return b}, update(p){f.op="update";(window.__WRITES=window.__WRITES||[]).push(["update",table,JSON.parse(JSON.stringify(p)),f]);return b}, delete(){(window.__WRITES=window.__WRITES||[]).push(["delete",table,null,f]);return b}, upsert(p){(window.__WRITES=window.__WRITES||[]).push(["upsert",table,JSON.parse(JSON.stringify(p))]);return b},
      then(res){ if(f.ins) return res({data: single ? f.ins[0] : f.ins, error:null}); const rows=(window.__DB[table]||[]).filter(r=>f.eq.every(([c,v])=>r[c]===v)&&f.is.every(([c,v])=>(r[c]??null)===v)&&f.in.every(([c,v])=>v.includes(r[c])));
        const st=range?range[0]:0, cap=range?range[1]-range[0]+1:1000; const out=rows.slice(st,st+Math.min(cap,1000));
        return res({data: single ? (out[0]||null) : out, error:null}); } };
    return b; } }) };`;
async function open(pageName, lang, opts = {}) {
  const root = opts.root || defRoot;
  const srv = http.createServer((q, r) => {
    const f = path.join(root, q.url.split("?")[0]);
    fs.readFile(f, (e, d) => {
      if (e) { r.writeHead(404); r.end(); return; }
      if (f.endsWith(".html") && !opts.keepInit) d = Buffer.from(d.toString().replace(/\n\s*init\(\);\s*\n/, "\n"));
      r.writeHead(200, { "Content-Type": mime(f) }); r.end(d);
    });
  }).listen(0);
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, locale: opts.browserLocale || "en-US" });
  const page = await ctx.newPage();
  await page.addInitScript((l) => { try { localStorage.setItem("pivot_lang", l); } catch (e) {} }, lang);
  if (pageName === "login" || opts.noSession) await page.addInitScript(() => { window.__NOSESSION = true; });
  if (pageName !== "login") await page.route("**/login.html*", (r) => r.abort());
  await page.route("**/cdn.jsdelivr.net/**", (route) => {
    const u = route.request().url();
    if (u.includes("supabase")) return route.fulfill({ contentType: "application/javascript", body: SUPA_STUB });
    if (u.includes("jspdf")) { const p = path.join(__dirname, "..", "..", "attn_test", "node_modules/jspdf/dist/jspdf.umd.min.js"); return route.fulfill({ contentType: "application/javascript", body: fs.readFileSync(p, "utf8") }); }
    if (u.includes("xlsx") && opts.realXlsx) { const x = fs.readFileSync(path.join(__dirname, "..", "..", "xl", "node_modules/xlsx/dist/xlsx.full.min.js"), "utf8"); return route.fulfill({ contentType: "application/javascript", body: x + ";(function(){var w=XLSX.writeFile;XLSX.writeFile=function(wb,name){window.__xlsx=name;window.__xlsxData=wb;};})();" }); }
    if (u.includes("xlsx")) return route.fulfill({ contentType: "application/javascript", body: "window.XLSX={utils:{aoa_to_sheet:(a)=>({aoa:a}),book_new:()=>({}),book_append_sheet(){},sheet_to_json(){return []}},writeFile(wb,name){window.__xlsx=name;window.__xlsxData=wb;}};" });
    return route.fulfill({ contentType: "application/javascript", body: "" });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  await page.goto(`http://localhost:${port}/${pageName}.html${opts.query || ""}`, { waitUntil: "domcontentloaded" });
  return { page, errors, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { open };
