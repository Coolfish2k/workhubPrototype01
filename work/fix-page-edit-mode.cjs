const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),appPath=path.join(root,'workhub-source/app.js');
let app=fs.readFileSync(appPath,'utf8');
app=app.replace("let tab='list',query='',status='',sort='new',editing=null;", "let tab='list',query='',status='',sort='new',editing=null;\nlet pageEditing=false,schemaDraft=null,recordScreen=null;");
const shellStart=app.indexOf('function shell(){'),shellEnd=app.indexOf('function activeFields()',shellStart);
app=app.slice(0,shellStart)+String.raw`function shell(){
  $('#wh-title').textContent=board().name;$('#wh-desc').textContent=board().desc;
  $('#wh-boards').innerHTML=state.boards.map((board,i)=>'<button class="wh-board '+(i===state.board?'selected':'')+'" data-board="'+i+'">▦ <span>'+esc(board.name)+'</span></button>').join('');
  root.querySelectorAll('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===tab);button.setAttribute('aria-selected',button.dataset.tab===tab)});
  panel.setAttribute('aria-labelledby','wh-tab-'+tab);
  $('#wh-page-actions').innerHTML=pageEditing?'<button type="button" id="wh-page-cancel">취소</button><button type="button" id="wh-page-save" class="wh-primary">저장</button>':'<button type="button" id="wh-page-edit" class="wh-primary">수정</button>';
  if(pageEditing){
    $('#wh-page-cancel').onclick=()=>{pageEditing=false;schemaDraft=null;recordScreen=null;toast('');render()};
    $('#wh-page-save').onclick=()=>{
      const recordForm=panel.querySelector('#wh-record-form');
      if(recordForm){recordForm.requestSubmit();return;}
      if(commitSchemaDraft())finishPageEdit();
    };
  }else $('#wh-page-edit').onclick=()=>{pageEditing=true;schemaDraft=null;toast('');render()};
}
function finishPageEdit(){pageEditing=false;schemaDraft=null;save();render();toast('저장했습니다.');}
function render(){
  shell();
  if(tab==='list'){
    if(recordScreen!==null){if(pageEditing)recordForm(recordScreen==='new'?null:recordScreen);else recordView(recordScreen);}
    else list();
  }
  if(tab==='schema'){if(pageEditing)schema();else schemaView();}
  if(tab==='history')history();
}
function schemaView(){
  const fields=activeFields();
  panel.innerHTML='<h3>입력 항목 설정</h3><div class="wh-table-wrap"><table aria-label="양식 설정"><thead><tr><th>항목 이름</th><th>입력 유형</th><th>필수</th></tr></thead><tbody>'+fields.map(field=>'<tr><td>'+esc(field.name)+'</td><td>'+({date:'날짜',number:'숫자',text:'텍스트',select:'드롭다운',upload:'업로드'}[field.type]||esc(field.type))+'</td><td>'+(field.required?'필수':'—')+'</td></tr>').join('')+'</tbody></table></div>';
}
`+app.slice(shellEnd);
// Restore the original date and amount sorting; keep dynamic active columns.
app=app.replace("sort==='old'?a.id-b.id:b.id-a.id", "sort==='amount'?total(b)-total(a):sort==='old'?String(a.date||'').localeCompare(String(b.date||'')):String(b.date||'').localeCompare(String(a.date||''))||b.id-a.id");
app=app.replace("$('#wh-count').textContent=records.length+'건';", "$('#wh-count').textContent=records.length+'건 · 합계 '+money(records.reduce((sum,record)=>sum+total(record),0));");
app=app.replace("'<th>상태</th></tr>","'<th>상태</th></tr>");
app=app.replace('<option value="new">등록 최신순</option><option value="old">등록 오래된순</option>', '<option value="new">사용일 최신순</option><option value="old">사용일 오래된순</option><option value="amount">금액 높은순</option>');
app=app.replace("if(!['old','new'].includes(sort))", "if(!['old','new','amount'].includes(sort))");
app=app.replace("<button class=\"wh-primary\" id=\"wh-add\">＋ 내역 작성</button>", "'+(pageEditing?'<button class=\"wh-primary\" id=\"wh-add\">＋ 내역 작성</button>':'')+'");
app=app.replace("$('#wh-add').onclick=()=>recordForm(null);", "if($('#wh-add'))$('#wh-add').onclick=()=>{recordScreen='new';recordForm(null)};");
// The header controls the mode; an individual view no longer has its own edit switch.
app=app.replace('<button type="button" class="wh-primary" id="wh-view-edit">수정</button>', '');
app=app.replace("$('#wh-view-back').onclick=render;\n  $('#wh-view-edit').onclick=()=>recordForm(id);", "$('#wh-view-back').onclick=()=>{recordScreen=null;render()};");
app=app.replace('function recordForm(id){\n  editing=id;', 'function recordForm(id){\n  if(!pageEditing){recordView(id);return;}\n  editing=id;');
app=app.replace('id="wh-cancel">취소</button>', 'id="wh-cancel">목록으로</button>');
app=app.replace("'<div class=\"wh-row\"><span></span><button type=\"submit\" class=\"wh-primary\">'+(id?'변경 저장':'등록하기')+'</button></div></form>'", "'</form>'");
// Actual string has the footer appended to the details block.
app=app.replace("<div class=\"wh-row\"><span></span><button type=\"submit\" class=\"wh-primary\">'+(id?'변경 저장':'등록하기')+'</button></div></form>", "</form>");
app=app.replace("$('#wh-cancel').onclick=()=>id?recordView(id):render();", "$('#wh-cancel').onclick=()=>{recordScreen=null;render()};");
app=app.replace('event.preventDefault();if(!validateUploads(form))return;', 'event.preventDefault();if(!pageEditing || !validateUploads(form))return;');
app=app.replace("save();recordView(data.id);toast('저장했습니다.');", "if(!commitSchemaDraft())return;recordScreen=data.id;finishPageEdit();");
// Keep the schema draft while changing tabs; save/cancel belongs to the page header.
app=app.replace('let draft = activeFields().map(f => ({...f, options: [...(f.options || [])]}));', 'if(!schemaDraft)schemaDraft=activeFields().map(f=>({...f,options:[...(f.options||[])]}));\n  const draft=schemaDraft;');
app=app.replace('<button class="wh-primary" type="submit">양식 저장</button>', '');
const handlerStart=app.indexOf("  $('#wh-schema').onsubmit = e => {"),handlerEnd=app.indexOf('\nfunction history()',handlerStart);
if(handlerStart<0||handlerEnd<0)throw new Error('Schema handler missing');
app=app.slice(0,handlerStart)+String.raw`  $('#wh-schema').onsubmit=event=>{event.preventDefault();if(pageEditing && commitSchemaDraft())finishPageEdit()};
}
function commitSchemaDraft(){
  if(!schemaDraft)return true;
  const next=schemaDraft.map(field=>({...field,active:true,name:field.name.trim(),options:field.type==='select'?field.options.map(option=>option.trim()):[]}));
  function invalid(message){toast(message);return false;}
  if(next.some(field=>!field.name))return invalid('항목 이름을 입력해 주세요.');
  if(new Set(next.map(field=>field.name)).size!==next.length)return invalid('항목 이름은 중복될 수 없습니다.');
  for(const field of next.filter(field=>field.type==='select')){
    if(!field.options.length||field.options.some(option=>!option))return invalid(field.name+': 선택 항목을 입력해 주세요.');
    if(new Set(field.options).size!==field.options.length)return invalid(field.name+': 선택 항목 이름은 중복될 수 없습니다.');
  }
  const old=board().fields;
  const previous=old.filter(field=>field.active!==false).map(field=>({...field,active:true,options:field.options||[]}));
  if(JSON.stringify(previous)!==JSON.stringify(next)){
    const changes=next.map(field=>{
      const prior=old.find(item=>item.id===field.id);
      if(!prior)return '항목 추가: '+field.name;
      return JSON.stringify({...prior,active:true,options:prior.options||[]})===JSON.stringify(field)?null:'항목 변경: '+prior.name+' → '+field.name;
    }).filter(Boolean);
    changes.push(...old.filter(field=>field.active!==false && !next.some(item=>item.id===field.id)).map(field=>'항목 제거: '+field.name));
    if(!changes.length)changes.push('항목 순서 변경');
    board().fields=[...next,...old.filter(field=>!next.some(item=>item.id===field.id)).map(field=>({...field,active:false}))];
    log('양식 변경',changes.join(' / '));
  }
  schemaDraft=null;
  return true;
}
`+app.slice(handlerEnd);
// New forms enter edit mode; board switches exit it. Tab switches retain the schema draft.
app=app.replace("tab='schema';query='';status='';log('양식 생성',name);save();render()", "tab='schema';pageEditing=true;schemaDraft=null;recordScreen=null;query='';status='';log('양식 생성',name);save();render()");
app=app.replace("if(b){state.board=Number(b.dataset.board);", "if(b){pageEditing=false;schemaDraft=null;recordScreen=null;state.board=Number(b.dataset.board);");
app=app.replace("if(t){tab=t.dataset.tab;", "if(t){recordScreen=null;tab=t.dataset.tab;");
app=app.replace("if(r)recordView(Number(r.dataset.record));", "if(r){recordScreen=Number(r.dataset.record);render();}");
fs.writeFileSync(appPath,app);
const indexPath=path.join(root,'workhub-source/index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace('<span class="wh-badge">관리자 보기</span>', '<div id="wh-page-actions" class="wh-gap"></div>');
fs.writeFileSync(indexPath,html);
console.log('Applied page edit mode and restored sorting and totals.');
