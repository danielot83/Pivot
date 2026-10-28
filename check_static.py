import sys, re, glob, subprocess, os, tempfile
from html.parser import HTMLParser
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.ids={}; s.err=[]; s.scripts=[]; s._in=None; s._buf=[]
    def handle_starttag(s,t,a):
        d=dict(a)
        if "id" in d: s.ids[d["id"]]=s.ids.get(d["id"],0)+1
        if t in VOID: return
        s.stack.append(t)
        if t=="script" and "src" not in d and d.get("type","text/javascript") in ("text/javascript","module","") : s._in=t; s._buf=[]
    def handle_startendtag(s,t,a):
        d=dict(a)
        if "id" in d: s.ids[d["id"]]=s.ids.get(d["id"],0)+1
    def handle_endtag(s,t):
        if t in VOID: return
        if t=="script" and s._in: s.scripts.append("".join(s._buf)); s._in=None
        if s.stack and s.stack[-1]==t: s.stack.pop()
        elif t in s.stack:
            while s.stack and s.stack[-1]!=t: s.err.append("sin cerrar <%s>"%s.stack.pop())
            s.stack.pop()
        else: s.err.append("cierre sobrante </%s>"%t)
    def handle_data(s,d):
        if s._in: s._buf.append(d)
bad=0
root=sys.argv[1]
for f in sorted(glob.glob(os.path.join(root,"*.html"))):
    p=P(); p.feed(open(f,encoding="utf8").read())
    dups=[k for k,v in p.ids.items() if v>1]
    js=[]
    for i,sc in enumerate(p.scripts):
        if "<!--" in sc and False: continue
        with tempfile.NamedTemporaryFile("w",suffix=".js",delete=False,encoding="utf8") as t: t.write(sc); n=t.name
        r=subprocess.run(["node","--check",n],capture_output=True,text=True); os.unlink(n)
        if r.returncode: js.append((i,r.stderr.strip().split("\n")[0:3]))
    unclosed=p.stack
    ok=not p.err and not dups and not js and not unclosed
    if not ok: bad+=1
    print(os.path.basename(f).ljust(26),"OK" if ok else "PROBLEMAS", "" if ok else (p.err[:3], dups[:5], js[:2], unclosed[:3]))
for f in sorted(glob.glob(os.path.join(root,"*.js"))):
    if os.path.basename(f).startswith("i18n-"): continue
    r=subprocess.run(["node","--check",f],capture_output=True,text=True)
    print(os.path.basename(f).ljust(26),"JS OK" if r.returncode==0 else "JS ERROR "+r.stderr[:200])
    bad+= r.returncode!=0
sys.exit(1 if bad else 0)
