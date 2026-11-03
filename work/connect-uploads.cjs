const fs=require('node:fs');
const path=require('node:path');
const appPath=path.resolve(__dirname,'../workhub-source/app.js');
let app=fs.readFileSync(appPath,'utf8');
app=app.replace(";const itemBody=$('#wh-items');", ";bindUploadControls($('#wh-record-form'));const itemBody=$('#wh-items');");
app=app.replace("e.preventDefault();const data=Object.fromEntries(new FormData(e.target));", "e.preventDefault();if(!validateUploads(e.target))return;const data=Object.fromEntries(new FormData(e.target));");
app=app.replace("${r[f.id]||'비어 있음'} → ${data[f.id]||'비어 있음'}", "${window.workhubFiles.parse(r[f.id])?.name||r[f.id]||'비어 있음'} → ${window.workhubFiles.parse(data[f.id])?.name||data[f.id]||'비어 있음'}");
app=app.replace('날짜·숫자·텍스트·드롭다운 중 선택할 수 있습니다.','날짜·숫자·텍스트·드롭다운·업로드 중 선택할 수 있습니다.');
fs.writeFileSync(appPath,app);
