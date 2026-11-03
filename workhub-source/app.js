// Standalone demo persistence. No server or shared database is connected.
const storageKey = 'workhub-prototype-v1';
let savedState = null;
try { savedState = JSON.parse(localStorage.getItem(storageKey)); } catch {}
window.openai = {
  widgetState: savedState,
  setWidgetState: async (state) => {
    window.openai.widgetState = state;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }
};

(()=>{
const root=document.getElementById('workhub-proto'),$=s=>root.querySelector(s),panel=$('#wh-panel');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconPaths={
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevronRight:'<path d="m9 18 6-6-6-6"/>',
  sortNone:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  sortAsc:'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  sortDesc:'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  filter:'<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  up:'<path d="m18 15-6-6-6 6"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  table:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/>',
  megaphone:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  calendar:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  card:'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>'
};
const icon=(name,size=14)=>'<svg class="wh-icon" xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[name]+'</svg>';
root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon,el.dataset.icon==='chevronRight'?12:15)});
const baseFields=()=>[{id:'date',name:'사용일',type:'date',required:true},{id:'owner',name:'사용자',type:'text',required:true},{id:'dept',name:'소속',type:'text',required:false},{id:'memo',name:'메모',type:'text',required:false}];
let state={board:0,boards:[{name:'카드 사용 내역',desc:'사용 내역과 증빙을 건별로 모아 관리합니다.',fields:baseFields(),records:[{id:1024,date:'2026-11-02',owner:'김서연',dept:'경영지원부',memo:'11월 사무용품 구매',status:'확인 대기',items:[{name:'복사용지 A4',amount:32000},{name:'잉크 카트리지',amount:58000}]},{id:1023,date:'2026-10-30',owner:'이도현',dept:'교육부',memo:'신입사원 교육',status:'확인 완료',items:[{name:'교육 교재',amount:108500}]},{id:1022,date:'2026-10-29',owner:'박지은',dept:'경영지원부',memo:'외부 미팅',status:'확인 대기',items:[{name:'회의실 대여',amount:60000},{name:'다과',amount:22500},{name:'주차비',amount:8000}]},{id:1021,date:'2026-10-28',owner:'최민수',dept:'운영부',memo:'지점 장비 구매',status:'확인 완료',items:[{name:'모니터',amount:249000}]},{id:1020,date:'2026-10-27',owner:'김서연',dept:'경영지원부',memo:'',status:'확인 완료',items:[{name:'택배비',amount:6500}]}],history:[{time:'2026.11.02 09:42',who:'김서연',title:'#1024 등록',detail:'상세 내역 2개 · 90,000원'},{time:'2026.10.30 15:10',who:'관리자',title:'#1023 상태 변경',detail:'확인 대기 → 확인 완료'},{time:'2026.10.27 10:00',who:'관리자',title:'양식 생성',detail:'카드 사용 내역 · 기본 항목 4개'}]},{name:'지연 사유 관리',desc:'업무별 지연 사유와 조치 내용을 기록합니다.',fields:[{id:'date',name:'발생일',type:'date',required:true},{id:'owner',name:'담당자',type:'text',required:true},{id:'memo',name:'지연 사유',type:'text',required:true}],records:[],history:[]}]};
let tab='list',query='';
let columnSort={id:'id',direction:'desc'},columnFilters={};
let dateRange={preset:'all',from:'',to:''};
let idDisplay='id';
let schemaEditing=false,schemaDraft=null,boardDraft=null,toastTimer=null;

// Every record is one 등록 번호 plus one or more lines. Field values live on the lines;
// 줄마다 only decides what the form offers, so switching it never converts stored data.
const newLineId=()=>'ln'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const recordMetaKeys=['id','createdAt','deleted','deletedAt','lines','items'];
const sampleCreatedAt={1023:'2026.10.30 10:15',1022:'2026.10.29 14:20',1021:'2026.10.28 11:05',1020:'2026.10.27 16:40'};
function migrateBoard(target){
  if(target.records.some(record=>!record.lines&&Array.isArray(record.items))){
    const amount=target.fields.find(field=>field.id==='amount');
    if(!target.fields.some(field=>field.id==='item')){
      const item={id:'item',name:'항목',type:'text',required:false,multi:true};
      if(amount){amount.multi=true;target.fields.splice(target.fields.indexOf(amount),0,item);}
      else target.fields.push(item,{id:'amount',name:'금액(원)',type:'number',required:false,multi:true});
    }
    if(!target.fields.some(field=>field.id==='status'))target.fields.push({id:'status',name:'상태',type:'select',required:false,options:['확인 대기','확인 완료']});
  }
  target.records.forEach(record=>{
    if(Array.isArray(record.lines))return;
    const first={lineId:newLineId()},extra=[];
    Object.keys(record).filter(key=>!recordMetaKeys.includes(key)).forEach(key=>{first[key]=record[key];delete record[key];});
    (Array.isArray(record.items)?record.items:[]).forEach((item,i)=>{
      const line=i===0?first:{lineId:newLineId()};
      line.item=item.name;line.amount=item.amount;
      if(i>0)extra.push(line);
    });
    record.lines=[first,...extra];
  });
  target.records.forEach(record=>{
    if(record.createdAt!==undefined)return;
    const logged=(target.history||[]).find(entry=>entry.title==='#'+record.id+' 등록');
    record.createdAt=logged?logged.time.replace(/-/g,'.'):(target.name==='카드 사용 내역'&&sampleCreatedAt[record.id])||null;
  });
}
function hydrate(s){if(s?.privateContent?.state?.boards?.length){state=s.privateContent.state;tab=s.privateContent.tab||'list';}state.boards.forEach(migrateBoard);}
hydrate(window.openai?.widgetState);
function save(){const snapshot={modelContent:{board:board().name,view:tab,recordCount:visibleRecords().length,fields:activeFields().map(f=>f.name)},privateContent:{state,tab}};window.openai?.setWidgetState(snapshot)?.catch(()=>toast('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.','error'));}
function board(){return state.boards[state.board]||state.boards[0]}
function visibleRecords(target=board()){return target.records.filter(record=>!record.deleted)}
function activeFields(){return board().fields.filter(field=>field.active!==false)}
const visibleLines=record=>record.lines.filter(line=>!line.deleted);
const isEmptyValue=value=>value===undefined||value===null||value==='';
const fieldValues=(record,field)=>visibleLines(record).map(line=>line[field.id]).filter(value=>!isEmptyValue(value));
// A field splits by line when 줄마다 is on, or when lines saved earlier still hold values for it.
const spansLines=(record,field)=>!!field.multi||visibleLines(record).slice(1).some(line=>!isEmptyValue(line[field.id]));
const now=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Seoul'}).slice(0,16).replace(/-/g,'.');
function log(title,detail){board().history.unshift({time:now(),who:'관리자 (예시)',title,detail});}
function toast(text,tone='ok'){
  const el=$('#wh-toast');
  clearTimeout(toastTimer);
  if(el.matches(':popover-open'))el.hidePopover();
  if(!text)return;
  el.textContent=text;el.dataset.tone=tone;el.showPopover();
  toastTimer=setTimeout(()=>{if(el.matches(':popover-open'))el.hidePopover()},tone==='error'?6000:3000);
}

/* Dialogs */
function openDialog(html,{label,small,wide}={}){
  const dialog=document.createElement('dialog');
  dialog.className='wh-dialog'+(small?' wh-dialog-sm':'')+(wide?' wh-dialog-wide':'');
  dialog.setAttribute('aria-label',label||'');
  dialog.innerHTML=html;
  root.appendChild(dialog);
  dialog.addEventListener('close',()=>dialog.remove());
  dialog.showModal();
  return dialog;
}
// Removes right away; the native close event is queued and can lag behind.
function closeDialog(dialog){if(dialog.open)dialog.close();dialog.remove();}
function confirmDialog({title,body,confirmLabel,danger}){
  return new Promise(resolve=>{
    const dialog=openDialog('<div class="wh-dialog-head"><h3>'+esc(title)+'</h3></div><div class="wh-dialog-body"><p class="wh-confirm-text">'+esc(body)+'</p></div><div class="wh-dialog-foot"><span class="wh-spacer"></span><button type="button" class="wh-btn" data-answer="no" autofocus>취소</button><button type="button" class="wh-btn '+(danger?'wh-btn-danger':'wh-btn-primary')+'" data-answer="yes">'+esc(confirmLabel)+'</button></div>',{label:title,small:true});
    const finish=answer=>{closeDialog(dialog);resolve(answer)};
    dialog.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>finish(button.dataset.answer==='yes'));
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});
  });
}
const dialogHead=title=>'<div class="wh-dialog-head"><h3>'+esc(title)+'</h3><button type="button" class="wh-icon-btn" data-dialog-x aria-label="닫기">'+icon('x',16)+'</button></div>';

/* Schema edits survive only until saved; leaving asks first when something changed. */
const comparableFields=fields=>JSON.stringify(fields.map(field=>({id:field.id,name:field.name,type:field.type,required:!!field.required,multi:!!field.multi,options:field.type==='select'?field.options||[]:[]})));
const schemaChanged=()=>!!schemaDraft&&(comparableFields(schemaDraft)!==comparableFields(activeFields())||boardDraft.name.trim()!==board().name||boardDraft.desc.trim()!==board().desc);
async function leaveSchema(){
  if(schemaChanged()&&!await confirmDialog({title:'저장하지 않은 변경 사항이 있습니다',body:'이동하면 양식 설정에서 변경한 내용이 사라집니다.',confirmLabel:'변경 사항 버리기',danger:true}))return false;
  schemaEditing=false;schemaDraft=null;
  return true;
}

function shell(){
  $('#wh-title').textContent=board().name;$('#wh-desc').textContent=board().desc;
  $('#wh-boards').innerHTML=state.boards.map((item,i)=>'<button type="button" class="wh-board '+(i===state.board?'selected':'')+'" data-board="'+i+'"'+(i===state.board?' aria-current="true"':'')+'><span class="wh-tile">'+icon('table',15)+'</span><span><b>'+esc(item.name)+'</b><small>내역 '+visibleRecords(item).length+'건</small></span></button>').join('');
  root.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-selected',button.dataset.tab===tab));
  $('[data-tab-count="list"]').textContent=visibleRecords().length;
  $('[data-tab-count="schema"]').textContent=activeFields().length;
  $('[data-tab-count="history"]').textContent=board().history.length;
  panel.setAttribute('aria-labelledby','wh-tab-'+tab);
  $('#wh-page-actions').innerHTML='';
}
function render(){
  shell();
  if(tab==='list')list();
  if(tab==='schema'){if(schemaEditing)schema();else schemaView();}
  if(tab==='history')history();
}

/* Field display */
function pillTone(value){
  if(/완료|승인/.test(value))return 'success';
  if(/대기|확인 중|접수|진행/.test(value))return 'warn';
  if(/반려|취소|거절/.test(value))return 'danger';
  return '';
}
function fieldText(field,record) {
  const value=record[field.id];
  if(value===undefined || value===null || value==='')return '—';
  if(field.type==='upload')return window.workhubFiles.parse(value)?.name || '—';
  if(field.type==='number' && Number.isFinite(Number(value)))return Number(value).toLocaleString('ko-KR');
  return String(value);
}
function fieldValue(field,record) {
  const text=fieldText(field,record);
  if(text==='—')return '<span class="wh-muted">—</span>';
  if(field.type==='upload')return '<button type="button" class="wh-file" data-open-attachment="'+esc(record[field.id])+'">'+icon('clip',12)+esc(text)+'</button>';
  if(field.type==='select'){const tone=pillTone(text);return '<span class="wh-pill'+(tone?' wh-pill-'+tone:'')+'">'+esc(text)+'</span>';}
  return esc(text);
}
// recordId is set in the list only. The value itself opens the detail; a span keeps the text selectable for copying.
function detailValue(html,recordId,focusable){
  return '<span class="wh-value" role="button" tabindex="'+(focusable?0:-1)+'" data-record="'+recordId+'">'+html+'</span>';
}
function fieldCell(field,line,attributes='',recordId=null,focusable=false){
  const isEmpty=fieldText(field,line)==='—';
  const canOpen=recordId!==null&&!isEmpty&&field.type!=='upload';
  const value=field.type==='text'&&!isEmpty?'<span class="wh-wrap">'+esc(fieldText(field,line))+'</span>':fieldValue(field,line);
  const inner=canOpen?detailValue(value,recordId,focusable):value;
  const className=field.type==='number'?' class="wh-num"':field.type==='date'?' class="wh-nowrap"':'';
  return '<td'+className+attributes+'>'+inner+'</td>';
}
function recordIdLabel(record){
  if(idDisplay==='date')return record.createdAt?esc(record.createdAt):'—';
  return record.id?'#'+record.id:'—';
}
function recordBody(record,fields,withActions){
  const lines=visibleLines(record),rowspan=lines.length>1?' rowspan="'+lines.length+'"':'';
  const toggleLabel=idDisplay==='date'?'등록 번호 보기':'등록일 보기';
  const idCell=withActions?'<td class="wh-nowrap"'+rowspan+'><button type="button" class="wh-link" data-toggle-id="'+record.id+'" title="'+toggleLabel+'" aria-label="'+recordIdLabel(record)+', '+toggleLabel+'">'+recordIdLabel(record)+'</button></td>':'<td class="wh-nowrap"'+rowspan+'>'+(record.id?'#'+record.id:'—')+'</td>';
  const actionCell='<td class="wh-col-actions"'+rowspan+'><div class="wh-row-actions"><button type="button" class="wh-btn wh-btn-sm" data-edit-record="'+record.id+'" aria-label="#'+record.id+' 수정">수정</button><button type="button" class="wh-icon-btn wh-icon-btn-danger" data-delete-record="'+record.id+'" aria-label="#'+record.id+' 삭제" title="이 내역 삭제">'+icon('trash',14)+'</button></div></td>';
  // Only the first value in a record is a tab stop, so a row doesn't cost one Tab per column.
  let focusable=withActions;
  const cell=(field,line,attributes)=>{
    const html=fieldCell(field,line,attributes,withActions?record.id:null,focusable);
    if(html.includes('wh-value'))focusable=false;
    return html;
  };
  return '<tbody class="wh-record'+(lines.length>1?' wh-record-lines':'')+'">'+lines.map((line,i)=>'<tr>'+(i===0?idCell:'')+fields.map(field=>spansLines(record,field)?cell(field,line,''):(i===0?cell(field,lines[0],rowspan):'')).join('')+(withActions&&i===0?actionCell:'')+'</tr>').join('')+'</tbody>';
}

/* Data list */
function inDateRange(record){
  if(!dateRange.from&&!dateRange.to)return true;
  const day=(record.createdAt||'').slice(0,10).replace(/\./g,'-');
  return !!day&&(!dateRange.from||day>=dateRange.from)&&(!dateRange.to||day<=dateRange.to);
}
function filterValues(record,field){
  const values=fieldValues(record,field).map(String);
  return values.length?values:[''];
}
function rows(){
  const fields=activeFields();
  const filtered=visibleRecords().filter(record=>
    inDateRange(record) &&
    (!query || [String(record.id),...visibleLines(record).flatMap(line=>fields.map(field=>fieldText(field,line)))].join(' ').toLowerCase().includes(query.toLowerCase())) &&
    fields.filter(field=>field.type==='select').every(field=>!Array.isArray(columnFilters[field.id]) || filterValues(record,field).some(value=>columnFilters[field.id].includes(value)))
  );
  const field=columnSort.id==='id'?(idDisplay==='date'?{id:'createdAt',type:'text'}:{id:'id',type:'number'}):fields.find(field=>field.id===columnSort.id && field.type!=='select');
  if(!field)return filtered.sort((a,b)=>b.id-a.id);
  return filtered.sort((a,b)=>{
    const systemField=field.id==='id'||field.id==='createdAt';
    const rawA=systemField?a[field.id]:fieldValues(a,field)[0],rawB=systemField?b[field.id]:fieldValues(b,field)[0];
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
  const numClass=field.type==='number'?' class="wh-num"':'';
  if(field.type==='select')return '<th scope="col"><button type="button" class="wh-th-btn" data-filter-field="'+esc(field.id)+'" aria-haspopup="dialog" aria-label="'+esc(field.name)+' 필터">'+esc(field.name)+icon('filter',12)+'<span class="wh-filter-count" data-filter-count="'+esc(field.id)+'"></span></button></th>';
  return '<th scope="col"'+numClass+' aria-sort="none" data-sort-head="'+esc(field.id)+'"><button type="button" class="wh-th-btn" data-sort-field="'+esc(field.id)+'" aria-label="'+esc(field.name)+' 정렬">'+esc(field.name)+'<span class="wh-sort-icon" data-sort-icon>'+icon('sortNone',12)+'</span></button></th>';
}
const hasActiveConditions=()=>!!query||!!dateRange.from||!!dateRange.to||Object.values(columnFilters).some(Array.isArray);
function emptyRow(colspan){
  let message='조건에 맞는 내역이 없습니다.',action='<br><button type="button" class="wh-btn wh-btn-sm" data-reset-filters>검색·필터 초기화</button>';
  if(!activeFields().length){message='아직 입력 항목이 없습니다. 먼저 양식을 설정해 주세요.';action='<br><button type="button" class="wh-btn wh-btn-sm" data-go-schema>양식 설정으로 이동</button>';}
  else if(!visibleRecords().length){message='아직 등록된 내역이 없습니다.';action='<br><button type="button" class="wh-btn wh-btn-sm" data-add-record>'+icon('plus',13)+'내역 작성</button>';}
  return '<tr><td colspan="'+colspan+'" class="wh-empty-cell">'+message+action+'</td></tr>';
}
function dataRows(){
  const records=rows(),fields=activeFields();
  const table=$('#wh-table');
  table.querySelectorAll('tbody').forEach(body=>body.remove());
  table.insertAdjacentHTML('beforeend',records.length?records.map(record=>recordBody(record,fields,true)).join(''):'<tbody>'+emptyRow(fields.length+2)+'</tbody>');
  const total=visibleRecords().length;
  const sums=fields.filter(field=>field.type==='number').map(field=>{
    const sum=records.flatMap(record=>fieldValues(record,field)).reduce((acc,value)=>acc+(Number.isFinite(Number(value))?Number(value):0),0);
    return '<span>'+esc(field.name)+' 합계 <b>'+sum.toLocaleString('ko-KR')+'</b></span>';
  }).join('');
  $('#wh-count').innerHTML='<div class="wh-foot-group"><span>'+(hasActiveConditions()?'<b>'+records.length+'</b>건 / 전체 '+total+'건':'총 <b>'+total+'</b>건')+'</span>'+(hasActiveConditions()?'<button type="button" class="wh-btn wh-btn-sm" data-reset-filters>검색·필터 초기화</button>':'')+'</div><div class="wh-foot-group">'+sums+'</div>';
  root.querySelectorAll('[data-sort-head]').forEach(th=>{
    const selected=columnSort.id===th.dataset.sortHead;
    th.setAttribute('aria-sort',selected?(columnSort.direction==='asc'?'ascending':'descending'):'none');
    th.querySelector('[data-sort-icon]').innerHTML=icon(selected?(columnSort.direction==='asc'?'sortAsc':'sortDesc'):'sortNone',12);
  });
  root.querySelectorAll('[data-filter-count]').forEach(span=>{
    const values=columnFilters[span.dataset.filterCount];
    span.textContent=Array.isArray(values)?values.length:'';
    span.closest('button').classList.toggle('is-filtered',Array.isArray(values));
  });
}
function openColumnFilter(field,anchor){
  const popover=$('#wh-filter-popover');
  const values=[...new Set([...(field.options||[]),...visibleRecords().flatMap(record=>filterValues(record,field))])];
  const selected=columnFilters[field.id];
  popover.innerHTML='<div class="wh-popover-head"><h3>'+esc(field.name)+'</h3><button type="button" class="wh-icon-btn" data-close-filter aria-label="필터 닫기">'+icon('x',14)+'</button></div><div class="wh-popover-actions"><button type="button" class="wh-btn wh-btn-sm" data-filter-all>전체 선택</button><button type="button" class="wh-btn wh-btn-sm" data-filter-none>전체 해제</button></div><div class="wh-filter-options">'+values.map((value,i)=>'<label><input type="checkbox" data-filter-value="'+i+'" '+(!Array.isArray(selected)||selected.includes(value)?'checked':'')+'><span>'+esc(value||'(비어 있음)')+'</span></label>').join('')+'</div>';
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
const datePresets=[['all','전체'],['today','오늘'],['week','최근 7일'],['month','이번 달'],['year','올해']];
function presetRange(preset){
  const today=now().slice(0,10).replace(/\./g,'-');
  if(preset==='today')return {from:today,to:today};
  if(preset==='week'){
    const [year,month,day]=today.split('-').map(Number);
    return {from:new Date(Date.UTC(year,month-1,day-6)).toISOString().slice(0,10),to:today};
  }
  if(preset==='month')return {from:today.slice(0,8)+'01',to:today};
  if(preset==='year')return {from:today.slice(0,5)+'01-01',to:today};
  return {from:'',to:''};
}
// Accepts 260404, 20260404, 26.4.4 and 2026-04-04. Returns null when it isn't a real date.
function parseDate(text){
  const digits=text.trim().match(/^(\d{2}|\d{4})[.\-/ ]?(\d{1,2})[.\-/ ]?(\d{1,2})$/);
  if(!digits)return null;
  const year=Number(digits[1].length===2?'20'+digits[1]:digits[1]),month=Number(digits[2]),day=Number(digits[3]);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return date.toISOString().slice(0,10);
}
const dateInput=(key,label)=>'<span class="wh-date"><input class="wh-input" id="wh-date-'+key+'" inputmode="numeric" aria-label="'+label+'" placeholder="예: 260404" autocomplete="off"><button type="button" class="wh-date-btn" data-date-pick="'+key+'" aria-label="'+label+' 달력에서 고르기">'+icon('calendar',14)+'</button><input class="wh-date-native" type="date" tabindex="-1" aria-hidden="true" data-date-native="'+key+'"></span>';
function syncDateControls(){
  root.querySelectorAll('[data-date-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.datePreset===dateRange.preset)));
  ['from','to'].forEach(key=>{
    const input=$('#wh-date-'+key);
    input.value=dateRange[key];input.removeAttribute('aria-invalid');
    $('[data-date-native="'+key+'"]').value=dateRange[key];
  });
  $('#wh-date-error').textContent=dateRange.from&&dateRange.to&&dateRange.from>dateRange.to?'시작일이 종료일보다 늦습니다.':'';
}
function bindFilterBar(){
  syncDateControls();
  root.querySelectorAll('[data-date-preset]').forEach(button=>button.onclick=()=>{
    dateRange={preset:button.dataset.datePreset,...presetRange(button.dataset.datePreset)};
    syncDateControls();dataRows();
  });
  function setDate(key,value){
    dateRange={...dateRange,[key]:value};
    dateRange.preset=!dateRange.from&&!dateRange.to?'all':'custom';
    syncDateControls();dataRows();
  }
  ['from','to'].forEach(key=>{
    const input=$('#wh-date-'+key),native=$('[data-date-native="'+key+'"]');
    input.onchange=()=>{
      if(!input.value.trim()){setDate(key,'');return;}
      const parsed=parseDate(input.value);
      if(parsed){setDate(key,parsed);return;}
      input.setAttribute('aria-invalid','true');
      $('#wh-date-error').textContent='날짜를 확인해 주세요. 예: 260404';
    };
    native.onchange=()=>setDate(key,native.value);
    $('[data-date-pick="'+key+'"]').onclick=()=>{
      try{native.showPicker();}catch{input.focus();}
    };
  });
}
function list(){
  $('#wh-page-actions').innerHTML='<button type="button" class="wh-btn wh-btn-primary" data-add-record>'+icon('plus',14)+'내역 작성</button>';
  panel.innerHTML='<div class="wh-filterbar"><div class="wh-filter-group"><span class="wh-filter-label">기간</span><div class="wh-segment" role="group" aria-label="기간">'+datePresets.map(([key,label])=>'<button type="button" data-date-preset="'+key+'" aria-pressed="false">'+label+'</button>').join('')+'</div></div><div class="wh-filter-group"><span class="wh-filter-label">직접 지정</span><span class="wh-date-range">'+dateInput('from','시작일')+'<span class="wh-muted">~</span>'+dateInput('to','종료일')+'</span></div><label class="wh-filter-group wh-filter-grow"><span class="wh-filter-label">검색어</span><span class="wh-search"><input class="wh-input" id="wh-search" placeholder="등록 번호, 입력 내용 검색" value="'+esc(query)+'"><i>'+icon('search',14)+'</i></span></label></div><p id="wh-date-error" class="wh-error wh-filter-error" role="alert"></p><div class="wh-table-wrap has-foot"><table class="wh-table" id="wh-table" aria-label="내역 목록"><thead><tr>'+headerCell({id:'id',name:'등록 번호',type:'text'})+activeFields().map(headerCell).join('')+'<th scope="col" class="wh-col-actions">관리</th></tr></thead></table></div><div class="wh-table-foot" id="wh-count"></div><div id="wh-filter-popover" class="wh-filter-popover" popover="auto"></div>';
  bindFilterBar();
  dataRows();
  $('#wh-search').oninput=event=>{query=event.target.value;dataRows()};
  root.querySelectorAll('[data-sort-field]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.sortField;
    columnSort={id,direction:columnSort.id===id&&columnSort.direction==='asc'?'desc':'asc'};
    dataRows();
  });
  root.querySelectorAll('[data-filter-field]').forEach(button=>button.onclick=()=>{const field=activeFields().find(field=>field.id===button.dataset.filterField);if(field)openColumnFilter(field,button)});
}

/* Record dialogs */
function recordView(id){
  const record=board().records.find(record=>record.id===id&&!record.deleted);
  if(!record)return;
  const fields=activeFields(),lineFields=fields.filter(field=>spansLines(record,field)),gridFields=fields.filter(field=>!spansLines(record,field)),lines=visibleLines(record);
  const grid='<dl class="wh-record-view"><div><dt>등록일</dt><dd>'+(record.createdAt?esc(record.createdAt):'<span class="wh-muted">—</span>')+'</dd></div>'+gridFields.map(field=>'<div><dt>'+esc(field.name)+'</dt><dd>'+fieldValue(field,lines[0])+'</dd></div>').join('')+'</dl>';
  const lineTable=lineFields.length?'<div class="wh-table-wrap wh-lines-block"><table class="wh-table" aria-label="줄별 내역"><thead><tr>'+lineFields.map(field=>'<th scope="col"'+(field.type==='number'?' class="wh-num"':'')+'>'+esc(field.name)+'</th>').join('')+'</tr></thead><tbody>'+lines.map(line=>'<tr>'+lineFields.map(field=>fieldCell(field,line)).join('')+'</tr>').join('')+'</tbody></table></div>':'';
  const dialog=openDialog(dialogHead('#'+id+' 상세')+'<div class="wh-dialog-body">'+grid+lineTable+'</div><div class="wh-dialog-foot"><button type="button" class="wh-btn wh-btn-danger-line" data-dialog-delete>'+icon('trash',14)+'삭제</button><span class="wh-spacer"></span><button type="button" class="wh-btn" data-dialog-close>닫기</button><button type="button" class="wh-btn wh-btn-primary" data-dialog-edit>수정</button></div>',{label:'#'+id+' 상세',wide:lineFields.length>2});
  dialog.querySelector('[data-dialog-x]').onclick=dialog.querySelector('[data-dialog-close]').onclick=()=>closeDialog(dialog);
  dialog.querySelector('[data-dialog-edit]').onclick=()=>{closeDialog(dialog);recordForm(id)};
  dialog.querySelector('[data-dialog-delete]').onclick=()=>deleteRecord(id,dialog);
}
async function deleteRecord(id,parentDialog){
  const confirmed=await confirmDialog({title:'#'+id+' 내역을 삭제할까요?',body:'목록에서 숨겨집니다. 입력한 값과 변경 이력은 그대로 보존됩니다.',confirmLabel:'삭제',danger:true});
  if(!confirmed)return;
  const record=board().records.find(record=>record.id===id);
  record.deleted=true;record.deletedAt=now();
  log('#'+id+' 삭제','목록에서 숨김 · 값과 이력은 보존');
  if(parentDialog)closeDialog(parentDialog);
  save();render();toast('#'+id+' 내역을 삭제했습니다.');
}
function fieldControl(f, source, name = f.id, required = f.required) {
  const value = String(source[f.id] ?? '');
  const attributes = 'class="wh-input" name="' + esc(name) + '" aria-label="' + esc(f.name) + '"' + (required ? ' required' : '');
  if (f.type === 'upload') {
    const file = window.workhubFiles.parse(value);
    return `<span class="wh-upload" data-upload-field="${esc(f.id)}" data-upload-name="${esc(f.name)}"${required?' data-upload-required':''}><input type="hidden" name="${esc(name)}" value="${esc(file?value:'')}"><span class="wh-upload-name">${esc(file?.name || '선택된 파일 없음')}</span><span class="wh-upload-actions"><button type="button" class="wh-btn wh-btn-sm" data-choose-file>파일 선택</button><button type="button" class="wh-btn wh-btn-sm" data-open-file ${file?'':'hidden'}>파일 열기</button></span><input type="file" data-file-fallback hidden></span>`;
  }
  if (f.type !== 'select') return '<input ' + attributes + ' type="' + esc(f.type) + '" value="' + esc(value) + '">';
  const choices = Array.isArray(f.options) ? f.options : [];
  // Keep a previously saved value selectable even after an option is removed.
  const legacy = value && !choices.includes(value)
    ? '<option value="' + esc(value) + '" selected>' + esc(value) + ' (이전 값)</option>' : '';
  return '<select ' + attributes + '><option value="">선택해 주세요</option>' + legacy + choices.map(option =>
    '<option value="' + esc(option) + '"' + (option === value ? ' selected' : '') + '>' + esc(option) + '</option>'
  ).join('') + '</select>';
}
function recordField(field,record) {
  const title=esc(field.name)+(field.required?' <span class="wh-required" aria-hidden="true">*</span>':'');
  if(field.type==='upload')return '<div class="wh-form-field"><span>'+title+'</span>'+fieldControl(field,record)+'</div>';
  return '<label class="wh-form-field"><span>'+title+'</span>'+fieldControl(field,record)+'</label>';
}
function lineRow(line,lineFields){
  return '<tr data-line-row="'+esc(line.lineId)+'">'+lineFields.map(field=>{
    // Unticked fields keep their saved values editable, but new lines don't get an input for them.
    const editable=field.multi||!isEmptyValue(line[field.id]);
    return '<td>'+(editable?fieldControl(field,line,'line:'+line.lineId+':'+field.id,field.multi&&field.required):'<span class="wh-muted">—</span>')+'</td>';
  }).join('')+'<td class="wh-line-remove"><button type="button" class="wh-icon-btn wh-icon-btn-danger" data-remove-line aria-label="이 줄 삭제" title="이 줄 삭제">'+icon('trash',14)+'</button></td></tr>';
}
function lineSummary(line,lineFields){
  return lineFields.map(field=>fieldText(field,line)).filter(text=>text!=='—').join(' · ')||'빈 줄';
}
function recordForm(id){
  const original=id?board().records.find(record=>record.id===id&&!record.deleted):null;
  if(id&&!original)return;
  if(!activeFields().length){tab='schema';schemaEditing=true;render();return;}
  const originalLines=original?visibleLines(original):[{lineId:newLineId()}];
  const source={lines:originalLines};
  const lineFields=activeFields().filter(field=>spansLines(source,field)),gridFields=activeFields().filter(field=>!spansLines(source,field));
  const canAddLines=lineFields.some(field=>field.multi);
  const title=id?'#'+id+' 수정':'새 내역 작성';
  const grid=gridFields.length?'<div class="wh-form-grid">'+gridFields.map(field=>recordField(field,originalLines[0])).join('')+'</div>':'';
  const editor=lineFields.length?'<div class="wh-lines-block"><div class="wh-table-wrap"><table class="wh-table wh-line-table" aria-label="줄별 입력"><thead><tr>'+lineFields.map(field=>'<th scope="col">'+esc(field.name)+(field.multi&&field.required?' <span class="wh-required" aria-hidden="true">*</span>':'')+'</th>').join('')+'<th scope="col"><span class="wh-sr">줄 삭제</span></th></tr></thead><tbody id="wh-line-rows">'+originalLines.map(line=>lineRow(line,lineFields)).join('')+'</tbody></table></div>'+(canAddLines?'<button type="button" class="wh-btn wh-btn-sm wh-line-add" data-add-line>'+icon('plus',13)+'줄 추가</button>':'')+'</div>':'';
  const dialog=openDialog('<form id="wh-record-form">'+dialogHead(title)+'<div class="wh-dialog-body">'+grid+editor+'</div><div class="wh-dialog-foot"><span class="wh-spacer"></span><button type="button" class="wh-btn" data-dialog-cancel>취소</button><button type="submit" class="wh-btn wh-btn-primary">저장</button></div></form>',{label:title,wide:lineFields.length>2});
  const form=dialog.querySelector('form');
  bindUploadControls(form);
  const rowsBody=form.querySelector('#wh-line-rows');
  function syncLineButtons(){
    if(!rowsBody)return;
    const buttons=rowsBody.querySelectorAll('[data-remove-line]');
    buttons.forEach(button=>{button.disabled=buttons.length===1;});
  }
  syncLineButtons();
  rowsBody?.addEventListener('click',event=>{
    const button=event.target.closest('[data-remove-line]');
    if(!button||button.disabled)return;
    button.closest('tr').remove();syncLineButtons();
  });
  form.querySelector('[data-add-line]')?.addEventListener('click',()=>{
    rowsBody.insertAdjacentHTML('beforeend',lineRow({lineId:newLineId()},lineFields));
    bindUploadControls(form);syncLineButtons();
    rowsBody.lastElementChild.querySelector('input:not([type=hidden]),select')?.focus();
  });
  const entries=()=>[...new FormData(form).entries()].filter(([,value])=>typeof value==='string');
  const snapshot=()=>JSON.stringify(entries());
  const initial=snapshot();
  async function attemptClose(){
    if(snapshot()!==initial&&!await confirmDialog({title:'작성 중인 내용을 버릴까요?',body:'저장하지 않은 내용은 사라집니다.',confirmLabel:'버리기',danger:true}))return;
    closeDialog(dialog);
  }
  dialog.querySelector('[data-dialog-x]').onclick=dialog.querySelector('[data-dialog-cancel]').onclick=attemptClose;
  dialog.addEventListener('cancel',event=>{event.preventDefault();attemptClose()});
  form.onsubmit=event=>{
    event.preventDefault();if(!validateUploads(form))return;
    const gridValues={},lineValues={};
    entries().forEach(([key,value])=>{
      if(!key.startsWith('line:')){gridValues[key]=value;return;}
      const [,lineId,fieldId]=key.split(':');
      (lineValues[lineId]||={})[fieldId]=value;
    });
    const byId=Object.fromEntries(originalLines.map(line=>[line.lineId,line]));
    const rowIds=rowsBody?[...rowsBody.querySelectorAll('[data-line-row]')].map(row=>row.dataset.lineRow):[originalLines[0].lineId];
    let next=rowIds.map(lineId=>({...(byId[lineId]||{lineId}),...lineValues[lineId]}));
    // A line added but left blank is not a line.
    const filled=next.filter(line=>byId[line.lineId]||Object.values(lineValues[line.lineId]||{}).some(value=>value!==''));
    if(filled.length)next=filled;
    const first=next[0],oldFirst=originalLines[0];
    if(oldFirst.lineId!==first.lineId){
      Object.keys(oldFirst).filter(key=>!['lineId','deleted','deletedAt'].includes(key)&&!lineFields.some(field=>field.id===key)&&!(key in first)).forEach(key=>{first[key]=oldFirst[key];});
    }
    Object.assign(first,gridValues);
    const removed=originalLines.filter(line=>!next.some(item=>item.lineId===line.lineId));
    const hiddenBefore=original?original.lines.filter(line=>line.deleted):[];
    const lines=[...next,...removed.map(line=>({...line,deleted:true,deletedAt:now()})),...hiddenBefore];
    const newId=id||Math.max(0,...board().records.map(record=>record.id))+1;
    let message='저장했습니다.';
    if(id){
      const changes=[];
      gridFields.forEach(field=>{
        if(String(oldFirst[field.id]??'')!==String(first[field.id]??''))changes.push(field.name+': '+fieldText(field,oldFirst)+' → '+fieldText(field,first));
      });
      next.forEach((line,i)=>{
        const before=byId[line.lineId];
        if(!before){changes.push('줄 추가: '+lineSummary(line,lineFields));return;}
        lineFields.forEach(field=>{
          if(String(before[field.id]??'')!==String(line[field.id]??''))changes.push((i+1)+'번째 줄 '+field.name+': '+fieldText(field,before)+' → '+fieldText(field,line));
        });
      });
      removed.forEach(line=>changes.push('줄 삭제: '+lineSummary(line,lineFields)));
      if(changes.length){original.lines=lines;log('#'+id+' 수정',changes.join(' / '));}
      else message='변경 사항이 없습니다.';
    }else{
      board().records.unshift({id:newId,createdAt:now(),lines});
      log('#'+newId+' 등록',next.length>1?'내역 등록 · '+next.length+'줄':'내역 등록');
    }
    closeDialog(dialog);save();render();toast(message);
  };
}
function bindUploadControls(form) {
  form.querySelectorAll('[data-upload-field]').forEach(container => {
    const value = container.querySelector('input[type="hidden"]');
    const name = container.querySelector('.wh-upload-name');
    const choose = container.querySelector('[data-choose-file]');
    const open = container.querySelector('[data-open-file]');
    const fallback = container.querySelector('[data-file-fallback]');
    async function remember(file,handle) {
      if (!file) return;
      container.dataset.uploadBusy='true'; choose.disabled=true;
      try {
        const stored = await window.workhubFiles.remember(file,handle);
        value.value=stored;name.textContent=file.name;open.hidden=false;
      } catch(error) { toast(error.message || '파일 정보를 저장하지 못했습니다.','error'); }
      finally { delete container.dataset.uploadBusy; choose.disabled=false; fallback.value=''; }
    }
    choose.onclick = async () => {
      if(typeof window.showOpenFilePicker==='function') {
        try { const [handle]=await window.showOpenFilePicker({multiple:false}); await remember(await handle.getFile(),handle); }
        catch(error) {
          if(error.name==='AbortError') return;
          if(error.name==='SecurityError' || error.name==='NotAllowedError') fallback.click();
          else toast(error.message || '파일 선택을 완료하지 못했습니다.','error');
        }
      } else fallback.click();
    };
    fallback.onchange=()=>remember(fallback.files[0]);
    open.onclick=async()=>{try{toast(await window.workhubFiles.open(value.value));}catch(error){toast(error.message || '파일을 열지 못했습니다.','error');}};
  });
}
function validateUploads(form) {
  if(form.querySelector('[data-upload-busy="true"]')) { toast('파일 연결이 끝난 후 저장해 주세요.','error');return false; }
  for(const container of form.querySelectorAll('[data-upload-required]')) {
    if(!window.workhubFiles.parse(container.querySelector('input[type="hidden"]').value)) {
      toast(container.dataset.uploadName+': 파일을 선택해 주세요.','error');
      container.querySelector('[data-choose-file]').focus();
      return false;
    }
  }
  return true;
}

/* Form settings */
const typeName=type=>({date:'날짜',number:'숫자',text:'텍스트',select:'드롭다운',upload:'업로드'}[type]||type);
// With 줄마다 on, the preview always shows two lines so the merged layout is visible.
function previewRecord(fields){
  const latest=visibleRecords().reduce((latest,record)=>!latest || record.id>latest.id?record:latest,null)||{id:null,lines:[{lineId:'preview-1'}]};
  if(!fields.some(field=>field.multi)||visibleLines(latest).length>1)return latest;
  const sample=(field,n)=>({number:String(n*1000),text:'예시 '+n,select:field.options?.[n-1]||'',date:now().slice(0,10).replace(/\./g,'-')}[field.type]||'');
  const first={...visibleLines(latest)[0]},second={lineId:'preview-2'};
  fields.filter(field=>field.multi).forEach(field=>{
    if(isEmptyValue(first[field.id]))first[field.id]=sample(field,1);
    second[field.id]=sample(field,2);
  });
  return {...latest,lines:[first,second]};
}
function previewTable(fields){
  return '<table class="wh-table" aria-label="입력 양식 미리보기"><thead><tr><th scope="col">등록 번호</th>'+fields.map(field=>'<th scope="col"'+(field.type==='number'?' class="wh-num"':'')+'>'+esc(field.name||'항목 이름')+'</th>').join('')+'</tr></thead>'+recordBody(previewRecord(fields),fields,false)+'</table>';
}
function schemaView(){
  const fields=activeFields();
  $('#wh-page-actions').innerHTML='<button type="button" class="wh-btn wh-btn-primary" id="wh-schema-edit">수정</button>';
  $('#wh-schema-edit').onclick=()=>{schemaEditing=true;schemaDraft=null;render()};
  panel.innerHTML='<section class="wh-section" aria-labelledby="wh-preview-title"><div class="wh-section-head"><div><h3 id="wh-preview-title">미리보기</h3><p>현재 열 구성과 가장 최근 내역입니다.</p></div></div><div class="wh-table-wrap">'+previewTable(fields)+'</div></section><section class="wh-section"><div class="wh-section-head"><h3>입력 항목</h3></div><div class="wh-table-wrap"><table class="wh-table" aria-label="양식 설정"><thead><tr><th scope="col">항목 이름</th><th scope="col">입력 유형</th><th scope="col">필수</th><th scope="col">줄마다</th></tr></thead><tbody>'+(fields.length?fields.map(field=>'<tr><td>'+esc(field.name)+'</td><td>'+typeName(field.type)+'</td><td>'+(field.required?'필수':'<span class="wh-muted">—</span>')+'</td><td>'+(field.multi?'줄마다':'<span class="wh-muted">—</span>')+'</td></tr>').join(''):'<tr><td colspan="4" class="wh-empty-cell">아직 입력 항목이 없습니다.</td></tr>')+'</tbody></table></div></section>';
}
function schema() {
  panel.innerHTML = `<section class="wh-section" aria-labelledby="wh-preview-title"><div class="wh-section-head"><div><h3 id="wh-preview-title">미리보기</h3><p>저장 전 변경 내용이 바로 반영됩니다.</p></div></div><div id="wh-preview-row" class="wh-table-wrap"></div></section>
    <form id="wh-schema" class="wh-section" novalidate><div class="wh-section-head"><h3>양식 정보</h3></div><div class="wh-form-grid wh-board-fields"><label class="wh-form-field"><span>양식 이름 <span class="wh-required" aria-hidden="true">*</span></span><input class="wh-input" id="wh-board-name" maxlength="40" value="${esc(boardDraft?.name??board().name)}"></label><label class="wh-form-field"><span>설명</span><input class="wh-input" id="wh-board-desc" value="${esc(boardDraft?.desc??board().desc)}"></label></div><div class="wh-section-head"><div><h3>입력 항목 <span id="wh-field-count" class="wh-hint"></span></h3><p>삭제한 항목은 숨겨지며, 기존 내역의 값은 보존됩니다. 줄마다를 끄면 새 내역부터 적용되고, 이미 입력한 여러 줄은 그대로 표시됩니다.</p></div></div>
    <div class="wh-schema-fields"><div class="wh-fields-header" aria-hidden="true"><span>항목 이름</span><span>입력 유형</span><span class="wh-column-center">필수</span><span class="wh-column-center">줄마다</span><span class="wh-column-center">순서</span><span class="wh-column-center">관리</span></div><div id="wh-field-list"></div></div>
    <div class="wh-actionbar"><button type="button" class="wh-btn" id="wh-field-add">${icon('plus',14)}항목 추가</button><div class="wh-actionbar-right"><p id="wh-schema-error" class="wh-error" role="alert"></p><button type="button" class="wh-btn" id="wh-schema-cancel">취소</button><button type="submit" class="wh-btn wh-btn-primary">저장</button></div></div></form>`;
  const error=text=>{$('#wh-schema-error').textContent=text;};
  if(!schemaDraft){
    schemaDraft=activeFields().map(f=>({...f,options:[...(f.options||[])]}));
    boardDraft={name:board().name,desc:board().desc};
    $('#wh-board-name').value=boardDraft.name;$('#wh-board-desc').value=boardDraft.desc;
  }
  $('#wh-board-name').oninput=e=>{boardDraft.name=e.target.value;e.target.removeAttribute('aria-invalid');error('');};
  $('#wh-board-desc').oninput=e=>{boardDraft.desc=e.target.value;};
  const draft=schemaDraft;
  function drawPreview() {
    $('#wh-field-count').textContent = draft.length + '개';
    $('#wh-preview-row').innerHTML=previewTable(draft);
  }
  function drawFields() {
    $('#wh-field-list').innerHTML = draft.length ? draft.map((f,i) => {
      const options = ['date','number','text','select','upload'];
      return `<section class="wh-field-editor"><div class="wh-field-row">
        <input class="wh-input" aria-label="항목 이름" data-field="${i}" value="${esc(f.name)}">
        <select class="wh-input" aria-label="입력 유형" data-type="${i}">${options.map(type=>'<option value="'+type+'">'+typeName(type)+'</option>').join('')}</select>
        <div class="wh-column-center"><input aria-label="필수 입력 여부" type="checkbox" data-required="${i}" ${f.required?'checked':''}></div>
        <div class="wh-column-center"><input aria-label="줄마다 입력 여부" type="checkbox" data-multi="${i}" ${f.multi?'checked':''}></div>
        <div class="wh-order"><button type="button" class="wh-icon-btn" data-up="${i}" ${i===0?'disabled':''} aria-label="항목 위로">${icon('up',14)}</button><button type="button" class="wh-icon-btn" data-down="${i}" ${i===draft.length-1?'disabled':''} aria-label="항목 아래로">${icon('down',14)}</button></div>
        <div class="wh-column-center"><button type="button" class="wh-icon-btn wh-icon-btn-danger" data-remove-field="${i}" aria-label="${esc(f.name)} 항목 삭제" title="항목 삭제">${icon('trash',14)}</button></div></div>
        ${f.type==='select'?`<div class="wh-options"><div class="wh-options-head"><span>선택 항목</span><span>${f.options.length}개</span></div>
        ${f.options.map((option,j)=>`<div class="wh-option-row"><input class="wh-input" aria-label="선택 항목 ${j+1}" data-option-field="${i}" data-option-index="${j}" value="${esc(option)}" placeholder="선택 항목 이름"><button type="button" class="wh-icon-btn wh-icon-btn-danger" style="height:36px;width:36px" data-remove-option="${i}" data-option-index="${j}" aria-label="선택 항목 ${j+1} 삭제">${icon('trash',14)}</button></div>`).join('')}
        <button type="button" class="wh-btn wh-btn-sm" data-add-option="${i}">${icon('plus',13)}선택 항목 추가</button></div>`:''}</section>`;
    }).join('') : '<p class="wh-empty-note">아직 항목이 없습니다. 아래 ‘항목 추가’로 시작해 주세요.</p>';
    draft.forEach((f,i) => {
      $(`[data-type="${i}"]`).value = f.type;
      $(`[data-field="${i}"]`).oninput = e => { f.name = e.target.value; e.target.removeAttribute('aria-invalid'); error(''); drawPreview(); };
      $(`[data-type="${i}"]`).onchange = e => {
        f.type = e.target.value;
        if (f.type === 'select' && !f.options.length) {
          f.options = [...new Set(visibleRecords().flatMap(r=>fieldValues(r,f)).map(String))];
          if (!f.options.length) f.options = ['선택 항목 1', '선택 항목 2'];
        }
        error(''); drawFields();
      };
      $(`[data-required="${i}"]`).onchange = e => { f.required = e.target.checked; drawPreview(); };
      $(`[data-multi="${i}"]`).onchange = e => { f.multi = e.target.checked; drawPreview(); };
      $(`[data-remove-field="${i}"]`).onclick=()=>{draft.splice(i,1);error('');drawFields();};
      $(`[data-up="${i}"]`).onclick = () => { [draft[i-1],draft[i]]=[draft[i],draft[i-1]]; drawFields(); };
      $(`[data-down="${i}"]`).onclick = () => { [draft[i],draft[i+1]]=[draft[i+1],draft[i]]; drawFields(); };
      if (f.type === 'select') {
        $(`[data-add-option="${i}"]`).onclick = () => {
          f.options.push(''); error(''); drawFields();
          $(`[data-option-field="${i}"][data-option-index="${f.options.length-1}"]`).focus();
        };
      }
    });
    root.querySelectorAll('[data-option-field]').forEach(input => {
      input.oninput = e => { draft[Number(input.dataset.optionField)].options[Number(input.dataset.optionIndex)] = e.target.value; e.target.removeAttribute('aria-invalid'); error(''); drawPreview(); };
    });
    root.querySelectorAll('[data-remove-option]').forEach(button => {
      button.onclick = () => { draft[Number(button.dataset.removeOption)].options.splice(Number(button.dataset.optionIndex),1); error(''); drawFields(); };
    });
    drawPreview();
  }
  drawFields();
  $('#wh-field-add').onclick = () => {
    draft.push({id:'custom'+Date.now()+'_'+draft.length,name:'새 항목',type:'text',required:false,options:[]});
    drawFields();
    const input=$(`[data-field="${draft.length-1}"]`);input.focus();input.select();
  };
  $('#wh-schema-cancel').onclick=async()=>{if(await leaveSchema())render();};
  $('#wh-schema').onsubmit=event=>{
    event.preventDefault();
    const changed=schemaChanged();
    if(!commitSchemaDraft())return;
    schemaEditing=false;save();render();toast(changed?'저장했습니다.':'변경 사항이 없습니다.');
  };
}
function commitSchemaDraft(){
  if(!schemaDraft)return true;
  const next=schemaDraft.map(field=>({...field,active:true,name:field.name.trim(),options:field.type==='select'?field.options.map(option=>option.trim()):[]}));
  function invalid(message,selector){
    $('#wh-schema-error').textContent=message;
    const input=$(selector);
    if(input){input.setAttribute('aria-invalid','true');input.focus();}
    return false;
  }
  const nextName=boardDraft.name.trim(),nextDesc=boardDraft.desc.trim();
  if(!nextName)return invalid('양식 이름을 입력해 주세요.','#wh-board-name');
  if(state.boards.some(item=>item!==board()&&item.name===nextName))return invalid('같은 이름의 업무 양식이 있습니다.','#wh-board-name');
  const blank=next.findIndex(field=>!field.name);
  if(blank>=0)return invalid('항목 이름을 입력해 주세요.',`[data-field="${blank}"]`);
  const duplicate=next.findIndex((field,i)=>next.findIndex(item=>item.name===field.name)!==i);
  if(duplicate>=0)return invalid('항목 이름은 중복될 수 없습니다.',`[data-field="${duplicate}"]`);
  for(const [i,field] of next.entries()){
    if(field.type!=='select')continue;
    if(!field.options.length)return invalid(field.name+': 선택 항목을 입력해 주세요.',`[data-add-option="${i}"]`);
    const empty=field.options.findIndex(option=>!option);
    if(empty>=0)return invalid(field.name+': 선택 항목을 입력해 주세요.',`[data-option-field="${i}"][data-option-index="${empty}"]`);
    const repeated=field.options.findIndex((option,j)=>field.options.indexOf(option)!==j);
    if(repeated>=0)return invalid(field.name+': 선택 항목 이름은 중복될 수 없습니다.',`[data-option-field="${i}"][data-option-index="${repeated}"]`);
  }
  if(board().name!==nextName){log('양식 이름 변경',board().name+' → '+nextName);board().name=nextName;}
  if(board().desc!==nextDesc){log('양식 설명 변경',(board().desc||'—')+' → '+(nextDesc||'—'));board().desc=nextDesc;}
  const old=board().fields;
  if(comparableFields(old.filter(field=>field.active!==false))!==comparableFields(next)){
    const changes=next.map(field=>{
      const prior=old.find(item=>item.id===field.id);
      if(!prior)return '항목 추가: '+field.name;
      if(comparableFields([prior])===comparableFields([field]))return null;
      if(prior.name!==field.name)return '항목 이름 변경: '+prior.name+' → '+field.name;
      return !!prior.multi!==!!field.multi?'줄마다 '+(field.multi?'켬':'끔')+': '+field.name:'항목 설정 변경: '+field.name;
    }).filter(Boolean);
    changes.push(...old.filter(field=>field.active!==false && !next.some(item=>item.id===field.id)).map(field=>'항목 제거: '+field.name));
    if(!changes.length)changes.push('항목 순서 변경');
    board().fields=[...next,...old.filter(field=>!next.some(item=>item.id===field.id)).map(field=>({...field,active:false}))];
    log('양식 변경',changes.join(' / '));
  }
  const active=activeFields();
  columnFilters=Object.fromEntries(Object.entries(columnFilters).filter(([id])=>active.some(field=>field.id===id && field.type==='select')));
  if(columnSort.id!=='id'&&!active.some(field=>field.id===columnSort.id&&field.type!=='select'))columnSort={id:'id',direction:'desc'};
  schemaDraft=null;
  return true;
}

function history(){panel.innerHTML=board().history.length?board().history.map(h=>`<article class="wh-event"><div class="wh-event-meta">${esc(h.time.replace(/-/g,'.'))}<br>${esc(h.who)}</div><div><h3>${esc(h.title)}</h3><p>${esc(h.detail)}</p></div></article>`).join(''):'<p class="wh-empty-note">아직 변경 기록이 없습니다.</p>';}

function resetListState(){query='';columnSort={id:'id',direction:'desc'};columnFilters={};dateRange={preset:'all',from:'',to:''};idDisplay='id';}
$('#wh-new-board').onclick=async()=>{
  if(!await leaveSchema())return;
  render();
  const dialog=openDialog('<form id="wh-create">'+dialogHead('새 업무 양식 만들기')+'<div class="wh-dialog-body"><div class="wh-form-grid"><label class="wh-form-field"><span>양식 이름 <span class="wh-required" aria-hidden="true">*</span></span><input class="wh-input" name="name" placeholder="예: 출장비 정산" required maxlength="40"></label><label class="wh-form-field"><span>설명</span><input class="wh-input" name="desc" placeholder="관리할 업무를 간단히 적어 주세요."></label></div></div><div class="wh-dialog-foot"><span class="wh-spacer"></span><button type="button" class="wh-btn" data-dialog-cancel>취소</button><button type="submit" class="wh-btn wh-btn-primary">만들고 항목 설정</button></div></form>',{label:'새 업무 양식 만들기'});
  dialog.querySelector('[data-dialog-x]').onclick=dialog.querySelector('[data-dialog-cancel]').onclick=()=>closeDialog(dialog);
  dialog.querySelector('form').onsubmit=e=>{
    e.preventDefault();
    const f=new FormData(e.target),name=f.get('name').trim();
    if(!name){e.target.elements.name.focus();return;}
    if(state.boards.some(b=>b.name===name)){toast('같은 이름의 업무 양식이 있습니다.','error');e.target.elements.name.focus();return;}
    state.boards.push({name,desc:f.get('desc')||'새로운 업무 양식입니다.',fields:[],records:[],history:[]});
    state.board=state.boards.length-1;tab='schema';schemaEditing=true;schemaDraft=null;resetListState();
    log('양식 생성',name);closeDialog(dialog);save();render();
  };
};
root.addEventListener('click',async e=>{
  const closest=selector=>e.target.closest(selector);
  const attachment=closest('[data-open-attachment]');
  if(attachment){e.preventDefault();window.workhubFiles.open(attachment.dataset.openAttachment).then(message=>toast(message)).catch(error=>toast(error.message,'error'));return;}
  const toggleId=closest('[data-toggle-id]');
  if(toggleId){
    idDisplay=idDisplay==='date'?'id':'date';
    dataRows();
    $('[data-toggle-id="'+toggleId.dataset.toggleId+'"]')?.focus();
    return;
  }
  const record=closest('[data-record]'),edit=closest('[data-edit-record]'),remove=closest('[data-delete-record]');
  if(record){
    // Dragging across a value to copy it should not open the pop-up.
    if(!window.getSelection().isCollapsed)return;
    recordView(Number(record.dataset.record));
    return;
  }
  if(edit){recordForm(Number(edit.dataset.editRecord));return;}
  if(remove){deleteRecord(Number(remove.dataset.deleteRecord));return;}
  if(closest('[data-add-record]')){recordForm(null);return;}
  if(closest('[data-reset-filters]')){query='';columnFilters={};dateRange={preset:'all',from:'',to:''};render();return;}
  if(closest('[data-go-schema]')){tab='schema';schemaEditing=true;schemaDraft=null;render();save();return;}
  const boardButton=closest('[data-board]'),tabButton=closest('[data-tab]');
  if(boardButton){
    const next=Number(boardButton.dataset.board);
    if(!await leaveSchema())return;
    state.board=next;resetListState();tab='list';render();save();
    return;
  }
  if(tabButton){
    const next=tabButton.dataset.tab;
    if(next===tab)return;
    if(!await leaveSchema())return;
    tab=next;render();save();
  }
});
root.addEventListener('keydown',e=>{
  const value=e.target.closest?.('.wh-value');
  if(value&&(e.key==='Enter'||e.key===' ')){e.preventDefault();recordView(Number(value.dataset.record));}
});
window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState){hydrate(e.detail.globals.widgetState);render()}});
render();
if(globalThis.Tweak){const appearance={density:'편안하게'};const tweak=new Tweak({container:root,onChange:()=>root.style.setProperty('--wh-cell',appearance.density==='촘촘하게'?'9px':'13px')});tweak.addSelect(appearance,'density',{label:'표 간격',options:['편안하게','촘촘하게']});}
})();
