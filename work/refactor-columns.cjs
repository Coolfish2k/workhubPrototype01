const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'workhub-source/app.js');
let app=fs.readFileSync(file,'utf8');
function replaceBlock(start,end,replacement){const from=app.indexOf(start),to=app.indexOf(end,from);if(from<0||to<0)throw Error('Missing '+start);app=app.slice(0,from)+replacement+'\n'+app.slice(to);}
app=app.replace("let tab='list',query='',status='',sort='new',editing=null;", "let tab='list',query='',editing=null;\nlet columnSort={id:'id',direction:'desc'},columnFilters={};");
replaceBlock('function schemaView(){','function activeFields()',String.raw`function previewTable(fields){
  const latest=board().records.reduce((latest,record)=>!latest || record.id>latest.id?record:latest,null);
  return '<table aria-label="입력 양식 한 행 미리보기"><thead><tr><th scope="col">등록 번호</th>'+fields.map(field=>'<th scope="col">'+esc(field.name||'항목 이름')+'</th>').join('')+'</tr></thead><tbody><tr><td>'+(latest?'#'+latest.id:'—')+'</td>'+fields.map(field=>'<td'+(field.type==='number'?' class="wh-preview-number"':'')+'>'+esc(latest?fieldText(field,latest):'—')+'</td>').join('')+'</tr></tbody></table>';
}
function schemaView(){
  const fields=activeFields();
  panel.innerHTML='<section class="wh-schema-preview" aria-labelledby="wh-preview-title"><h3 id="wh-preview-title">미리보기</h3><div class="wh-table-wrap">'+previewTable(fields)+'</div></section><h3>입력 항목 설정</h3><div class="wh-table-wrap"><table aria-label="양식 설정"><thead><tr><th>항목 이름</th><th>입력 유형</th><th>필수</th></tr></thead><tbody>'+fields.map(field=>'<tr><td>'+esc(field.name)+'</td><td>'+({date:'날짜',number:'숫자',text:'텍스트',select:'드롭다운',upload:'업로드'}[field.type]||esc(field.type))+'</td><td>'+(field.required?'필수':'—')+'</td></tr>').join('')+'</tbody></table></div>';
}
`);
replaceBlock('function rows(){','function fieldControl(',String.raw`function rows(){
  const fields=activeFields();
  const filtered=board().records.filter(record=>
    (!query || [String(record.id),...fields.map(field=>fieldText(field,record))].join(' ').toLowerCase().includes(query.toLowerCase())) &&
    fields.filter(field=>field.type==='select').every(field=>!Array.isArray(columnFilters[field.id]) || columnFilters[field.id].includes(String(record[field.id]??'')))
  );
  const field=columnSort.id==='id'?{id:'id',type:'number'}:fields.find(field=>field.id===columnSort.id && field.type!=='select');
  if(!field)return filtered.sort((a,b)=>b.id-a.id);
  return filtered.sort((a,b)=>{
    const rawA=a[field.id],rawB=b[field.id];
    const valueA=field.type==='upload'?window.workhubFiles.parse(rawA)?.name:rawA;
    const valueB=field.type==='upload'?window.workhubFiles.parse(rawB)?.name:rawB;
    const emptyA=valueA===undefined||valueA===null||valueA===''||(field.type==='number'&&!Number.isFinite(Number(valueA)));
    const emptyB=valueB===undefined||valueB===null||valueB===''||(field.type==='number'&&!Number.isFinite(Number(valueB)));
    if(emptyA!==emptyB)return emptyA?1:-1;
    if(emptyA)return a.id-b.id;
    const comparison=field.type==='number'?Number(valueA)-Number(valueB):String(valueA).localeCompare(String(valueB),'ko',{numeric:true});
    return (columnSort.direction==='asc'?comparison:-comparison)||a.id-b.id;
  });
}
function headerCell(field){
  const selected=columnSort.id===field.id;
  if(field.type==='select'){
    const count=columnFilters[field.id]?.length;
    return '<th scope="col"><button type="button" class="wh-filter-toggle" data-filter-field="'+esc(field.id)+'" aria-label="'+esc(field.name)+' 필터">'+esc(field.name)+' <span aria-hidden="true">▾</span><span data-filter-count="'+esc(field.id)+'">'+(Array.isArray(columnFilters[field.id])?' ('+count+')':'')+'</span></button></th>';
  }
  return '<th scope="col" aria-sort="'+(selected?(columnSort.direction==='asc'?'ascending':'descending'):'none')+'"><div class="wh-column-heading"><span>'+esc(field.name)+'</span><span class="wh-sort-pair">'+['asc','desc'].map(direction=>'<button type="button" data-sort-field="'+esc(field.id)+'" data-sort-direction="'+direction+'" aria-label="'+esc(field.name)+(direction==='asc'?' 오름차순':' 내림차순')+'" aria-pressed="'+(selected&&columnSort.direction===direction)+'">'+(direction==='asc'?'↑':'↓')+'</button>').join('')+'</span></div></th>';
}
function dataRows(){
  const records=rows(),fields=activeFields();
  $('#wh-body').innerHTML=records.length?records.map(record=>'<tr><td><button class="wh-link" data-record="'+record.id+'">#'+record.id+'</button></td>'+fields.map(field=>'<td'+(field.type==='number'?' class="wh-amount"':'')+'>'+fieldValue(field,record)+'</td>').join('')+'</tr>').join(''):
    '<tr><td colspan="'+(fields.length+1)+'" style="text-align:center;padding:36px">조건에 맞는 데이터가 없습니다.</td></tr>';
  $('#wh-count').textContent=records.length+'건 / 전체 '+board().records.length+'건';
  root.querySelectorAll('[data-sort-field]').forEach(button=>{
    const selected=columnSort.id===button.dataset.sortField && columnSort.direction===button.dataset.sortDirection;
    button.setAttribute('aria-pressed',String(selected));
    button.closest('th').setAttribute('aria-sort',columnSort.id===button.dataset.sortField?(columnSort.direction==='asc'?'ascending':'descending'):'none');
  });
  root.querySelectorAll('[data-filter-count]').forEach(span=>{
    const values=columnFilters[span.dataset.filterCount];span.textContent=Array.isArray(values)?' ('+values.length+')':'';
  });
}
function openColumnFilter(field,anchor){
  const popover=$('#wh-filter-popover');
  const values=[...new Set([...(field.options||[]),...board().records.map(record=>String(record[field.id]??''))])];
  const selected=columnFilters[field.id];
  popover.innerHTML='<div class="wh-row"><h3>'+esc(field.name)+'</h3><button type="button" data-close-filter aria-label="필터 닫기">×</button></div><div class="wh-gap"><button type="button" data-filter-all>전체 선택</button><button type="button" data-filter-none>전체 해제</button></div><div class="wh-filter-options">'+values.map((value,i)=>'<label><input type="checkbox" data-filter-value="'+i+'" '+(!Array.isArray(selected)||selected.includes(value)?'checked':'')+'><span>'+esc(value||'(비어 있음)')+'</span></label>').join('')+'</div>';
  function selectAll(all){columnFilters[field.id]=all?null:[];popover.querySelectorAll('input[type="checkbox"]').forEach(input=>input.checked=all);dataRows();}
  popover.querySelector('[data-filter-all]').onclick=()=>selectAll(true);
  popover.querySelector('[data-filter-none]').onclick=()=>selectAll(false);
  popover.querySelector('[data-close-filter]').onclick=()=>popover.hidePopover();
  popover.querySelectorAll('[data-filter-value]').forEach(input=>input.onchange=()=>{
    const checked=[...popover.querySelectorAll('[data-filter-value]:checked')].map(input=>values[Number(input.dataset.filterValue)]);
    columnFilters[field.id]=checked.length===values.length?null:checked;dataRows();
  });
  if(popover.matches(':popover-open'))popover.hidePopover();
  popover.showPopover();
  const rect=anchor.getBoundingClientRect(),width=Math.min(280,window.innerWidth-24);
  popover.style.width=width+'px';popover.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';
  popover.style.top=Math.max(12,Math.min(rect.bottom+6,window.innerHeight-popover.offsetHeight-12))+'px';
}
function list(){
  panel.innerHTML='<div class="wh-row"><input class="wh-list-search" aria-label="내역 검색" id="wh-search" placeholder="내역 검색" value="'+esc(query)+'"><button class="wh-primary" id="wh-add">＋ 내역 작성</button></div>'+
    '<div class="wh-table-wrap"><table aria-label="내역 목록"><thead><tr>'+headerCell({id:'id',name:'등록 번호',type:'number'})+activeFields().map(headerCell).join('')+'</tr></thead><tbody id="wh-body"></tbody></table></div><div class="wh-foot"><span id="wh-count"></span></div><div id="wh-filter-popover" class="wh-filter-popover" popover="auto"></div>';
  dataRows();$('#wh-search').oninput=event=>{query=event.target.value;dataRows()};
  $('#wh-add').onclick=()=>{pageEditing=true;recordScreen='new';shell();recordForm(null)};
  root.querySelectorAll('[data-sort-field]').forEach(button=>button.onclick=()=>{columnSort={id:button.dataset.sortField,direction:button.dataset.sortDirection};dataRows()});
  root.querySelectorAll('[data-filter-field]').forEach(button=>button.onclick=()=>{const field=activeFields().find(field=>field.id===button.dataset.filterField);if(field)openColumnFilter(field,button)});
}
function recordView(id){
  editing=null;
  const record=board().records.find(record=>record.id===id);
  if(!record){recordScreen=null;render();return;}
  panel.innerHTML='<div class="wh-row"><h3>#'+id+'</h3><button type="button" id="wh-view-back">목록으로</button></div><dl class="wh-record-view">'+activeFields().map(field=>'<div><dt>'+esc(field.name)+'</dt><dd>'+fieldValue(field,record)+'</dd></div>').join('')+'</dl>';
  $('#wh-view-back').onclick=()=>{recordScreen=null;render()};
}
`);
replaceBlock('function recordForm(id){','function recordField(',String.raw`function recordForm(id){
  if(!pageEditing){recordView(id);return;}
  editing=id;
  const original=id?board().records.find(record=>record.id===id):null,record=original||{};
  panel.innerHTML='<form id="wh-record-form"><div class="wh-row"><h3>'+(id?'#'+id+' 수정':'새 내역 작성')+'</h3><button type="button" id="wh-cancel">목록으로</button></div><div class="wh-form-grid">'+activeFields().map(field=>recordField(field,record)).join('')+'</div></form>';
  const form=$('#wh-record-form');bindUploadControls(form);
  $('#wh-cancel').onclick=()=>{recordScreen=null;render()};
  form.onsubmit=event=>{
    event.preventDefault();if(!pageEditing || !validateUploads(form))return;
    const data={...(original||{}),...Object.fromEntries(new FormData(form))};
    data.id=id||Math.max(0,...board().records.map(record=>record.id))+1;
    if(!commitSchemaDraft())return;
    if(id){
      const changes=activeFields().filter(field=>String(record[field.id]??'')!==String(data[field.id]??'')).map(field=>field.name+': '+fieldText(field,record)+' → '+fieldText(field,data));
      if(changes.length){board().records[board().records.findIndex(record=>record.id===id)]=data;log('#'+id+' 수정',changes.join(' / '));}
    }else{board().records.unshift(data);log('#'+data.id+' 등록','내역 등록');}
    recordScreen=data.id;finishPageEdit();
  };
}
`);
// Both viewing and editing show the same current columns and the most recent record.
const previewStart=app.indexOf('    const sample = f => {'),previewEnd=app.indexOf('\n  function drawFields()',previewStart);
if(previewStart<0||previewEnd<0)throw Error('Preview renderer not found');
app=app.slice(0,previewStart)+"    preview.innerHTML=previewTable(draft);\n  }"+app.slice(previewEnd);
app=app.replace('<span class="wh-muted">예시 데이터</span>','');
app=app.replace('    <div class="wh-detail"><h3>반복 입력 영역 · 상세 내역</h3><p class="wh-muted" style="margin-top:6px">항목명 + 금액 · 등록 한 건에 여러 행 추가 가능 · 합계 자동 표시</p></div>\n','');
// A new workspace has no compulsory business fields.
app=app.replace('fields:baseFields(),records:[],history:[]','fields:[],records:[],history:[]');
app=app.replaceAll("query='';status='';", "query='';columnSort={id:'id',direction:'desc'};columnFilters={};");
// Saved schema changes invalidate hidden column filters and stale sort references.
app=app.replace('  schemaDraft=null;\n  return true;', "  const active=activeFields();\n  columnFilters=Object.fromEntries(Object.entries(columnFilters).filter(([id])=>active.some(field=>field.id===id && field.type==='select')));\n  if(columnSort.id!=='id'&&!active.some(field=>field.id===columnSort.id&&field.type!=='select'))columnSort={id:'id',direction:'desc'};\n  schemaDraft=null;\n  return true;");
fs.writeFileSync(file,app);
console.log('Replaced fixed business columns with schema-driven columns and composed filtering/sorting.');
