const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root,'workhub-source');
const appPath = path.join(source,'app.js');
let app = fs.readFileSync(appPath,'utf8');
app = app.replace("const error = text => { $('#wh-schema-error').textContent = text; };", "const error = text => { $('#wh-schema-error').textContent = text; toast(''); };");
fs.writeFileSync(appPath,app);
const css=fs.readFileSync(path.join(source,'styles.css'),'utf8');
const localFiles=fs.readFileSync(path.join(source,'local-files.js'),'utf8');
const devNotes=fs.readFileSync(path.join(source,'dev-notes.js'),'utf8');
const html=fs.readFileSync(path.join(source,'index.html'),'utf8')
  .replace('<link rel="stylesheet" href="styles.css">',()=>'<style>\n'+css+'\n</style>')
  .replace('  <script src="app.js" defer></script>','')
  .replace('  <script src="local-files.js" defer></script>','')
  .replace('  <script src="dev-notes.js" defer></script>','')
  .replace('</body>',()=>'<script>\n'+localFiles+'\n'+app+'\n'+devNotes+'\n</script>\n</body>');
fs.writeFileSync(path.join(root,'workhub-preview.html'),html);
const readmePath=path.join(source,'README.md');
const readme=fs.readFileSync(readmePath,'utf8').replace('용량이 작은 예시용 상태 저장이며','예시용 상태 저장이며');
fs.writeFileSync(readmePath,readme);
console.log('Updated standalone preview and source.');
