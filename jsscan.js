// como untranslated.js pero para un archivo .js suelto (envuelve como si fuera una página con <script>)
const fs=require("fs"),path=require("path");
const f=process.argv[2]; const src=fs.readFileSync(path.join(__dirname,"..","Pivot-main",f),"utf8");
const tmp=path.join(__dirname,"..","Pivot-main","__tmp_scan.html");
fs.writeFileSync(tmp,"<script>"+src+"</script>");
require("child_process").execSync(`node ${path.join(__dirname,"untranslated.js")} __tmp_scan.html`,{stdio:"inherit"});
fs.unlinkSync(tmp);
