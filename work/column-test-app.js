// Standalone demo persistence. No server or shared database is connected.
const storageKey = 'workhub-column-test-v1';
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
const money=v=>Number(v||0).toLocaleString('ko-KR')+'원';
const baseFields=()=>[{id:'date',name:'사용일',type:'date',required:true},{id:'owner',name:'사용자',type:'text',required:true},{id:'dept',name:'소속',type:'text',required:false},{id:'memo',name:'메모',type:'text',required:false}];
let state={"board":0,"boards":[{"name":"열 기능 검증","desc":"테스트","fields":[{"id":"d","name":"날짜","type":"date","required":false},{"id":"n","name":"금액","type":"number","required":false},{"id":"kind","name":"구분","type":"select","options":["일반","긴급"],"required":false},{"id":"dept","name":"부서","type":"select","options":["운영","지원"],"required":false},{"id":"memo","name":"메모","type":"text","required":false}],"records":[{"id":1,"d":"2026-10-01","n":"2","kind":"일반","dept":"운영","memo":"첫째"},{"id":2,"d":"2026-11-02","n":"10","kind":"긴급","dept":"운영","memo":"둘째"},{"id":3,"d":"2026-09-01","n":"100","kind":"긴급","dept":"지원","memo":"셋째"},{"id":4,"kind":"일반","dept":"지원","memo":"최근 등록"}],"history":[]}]};
let tab='list',query='',editing=null;
let columnSort={id:'id',direction:'desc'},columnFilters={};
let pageEditing=false,schemaDraft=null,recordScreen=null;
function hydrate(s){if(s?.privateContent?.state?.boards?.length){state=s.privateContent.state;tab=s.privateContent.tab||'list';}}
hydrate(window.openai?.widgetState);
function save(){const snapshot={modelContent:{board:board().name,view:tab,recordCount:board().records.length,fields:activeFields().map(f=>f.name)},privateContent:{state,tab}};window.openai?.setWidgetState(snapshot)?.catch(()=>toast('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.'));}
function board(){return state.boards[state.board]||state.boards[0]}
function log(title,detail){board().history.unshift({time:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Seoul'}).slice(0,16),who:'관리자 (예시)',title,detail});}
function toast(t){$('#wh-toast').textContent=t}
function shell(){
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
function previewTable(fields){
  const latest=board().records.reduce((latest,record)=>!latest || record.id>latest.id?record:latest,null);
  return '<table aria-label="입력 양식 한 행 미리보기"><thead><tr><th scope="col">등록 번호</th>'+fields.map(field=>'<th scope="col">'+esc(field.name||'항목 이름')+'</th>').join('')+'</tr></thead><tbody><tr><td>'+(latest?'#'+latest.id:'—')+'</td>'+fields.map(field=>'<td'+(field.type==='number'?' class="wh-preview-number"':'')+'>'+esc(latest?fieldText(field,latest):'—')+'</td>').join('')+'</tr></tbody></table>';
}
function schemaView(){
  const fields=activeFields();
  panel.innerHTML='<section class="wh-schema-preview" aria-labelledby="wh-preview-title"><h3 id="wh-preview-title">미리보기</h3><div class="wh-table-wrap">'+previewTable(fields)+'</div></section><h3>입력 항목 설정</h3><div class="wh-table-wrap"><table aria-label="양식 설정"><thead><tr><th>항목 이름</th><th>입력 유형</th><th>필수</th></tr></thead><tbody>'+fields.map(field=>'<tr><td>'+esc(field.name)+'</td><td>'+({date:'날짜',number:'숫자',text:'텍스트',select:'드롭다운',upload:'업로드'}[field.type]||esc(field.type))+'</td><td>'+(field.required?'필수':'—')+'</td></tr>').join('')+'</tbody></table></div>';
}

function activeFields(){return board().fields.filter(field=>field.active!==false)}
function fieldText(field,record) {
  const value=record[field.id];
  if(value===undefined || value===null || value==='')return '—';
  if(field.type==='upload')return window.workhubFiles.parse(value)?.name || '—';
  if(field.type==='number' && Number.isFinite(Number(value)))return Number(value).toLocaleString('ko-KR');
  return String(value);
}
function fieldValue(field,record) {
  const text=fieldText(field,record);
  if(field.type==='upload' && window.workhubFiles.parse(record[field.id]))
    return '<button type="button" class="wh-link" data-open-attachment="'+esc(record[field.id])+'">'+esc(text)+'</button>';
  return esc(text);
}
function rows(){
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

function fieldControl(f, record) {
  const value = String(record[f.id] ?? '');
  const attributes = 'name="' + esc(f.id) + '"' + (f.required ? ' required' : '');
  if (f.type === 'upload') {
    const file = window.workhubFiles.parse(value);
    return `<span class="wh-upload" data-upload-field="${esc(f.id)}"><input type="hidden" name="${esc(f.id)}" value="${esc(file?value:'')}"><span class="wh-upload-name">${esc(file?.name || '선택된 파일 없음')}</span><span class="wh-gap"><button type="button" data-choose-file>파일 선택</button><button type="button" data-open-file ${file?'':'hidden'}>파일 열기</button></span><input type="file" data-file-fallback hidden></span>`;
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
function recordForm(id){
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

function recordField(field,record) {
  const title=esc(field.name)+(field.required?' *':'');
  if(field.type==='upload')return '<div class="wh-record-field"><span>'+title+'</span>'+fieldControl(field,record)+'</div>';
  return '<label>'+title+fieldControl(field,record)+'</label>';
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
      } catch(error) { toast(error.message || '파일 정보를 저장하지 못했습니다.'); }
      finally { delete container.dataset.uploadBusy; choose.disabled=false; fallback.value=''; }
    }
    choose.onclick = async () => {
      if(typeof window.showOpenFilePicker==='function') {
        try { const [handle]=await window.showOpenFilePicker({multiple:false}); await remember(await handle.getFile(),handle); }
        catch(error) {
          if(error.name==='AbortError') return;
          if(error.name==='SecurityError' || error.name==='NotAllowedError') fallback.click();
          else toast(error.message || '파일 선택을 완료하지 못했습니다.');
        }
      } else fallback.click();
    };
    fallback.onchange=()=>remember(fallback.files[0]);
    open.onclick=async()=>{try{toast(await window.workhubFiles.open(value.value));}catch(error){toast(error.message || '파일을 열지 못했습니다.');}};
  });
}
function validateUploads(form) {
  if(form.querySelector('[data-upload-busy="true"]')) { toast('파일 연결이 끝난 후 저장해 주세요.');return false; }
  for(const field of activeFields().filter(f=>f.type==='upload' && f.required)) {
    const control=form.elements.namedItem(field.id);
    if(!window.workhubFiles.parse(control?.value)) {
      toast(field.name+': 파일을 선택해 주세요.');
      control?.closest('[data-upload-field]')?.querySelector('[data-choose-file]')?.focus();
      return false;
    }
  }
  return true;
}
function schema() {
  panel.innerHTML = `<section class="wh-schema-preview" aria-labelledby="wh-preview-title"><div class="wh-row"><h3 id="wh-preview-title">미리보기</h3></div><div id="wh-preview-row" class="wh-table-wrap"></div></section>
    <div class="wh-row"><div><h3>입력 항목 설정</h3><p class="wh-muted" style="margin-top:4px">날짜·숫자·텍스트·드롭다운·업로드 중 선택할 수 있습니다.</p></div><span id="wh-field-count" class="wh-badge">${board().fields.length}개 기본 항목</span></div>
    <form id="wh-schema"><div class="wh-schema-fields"><div class="wh-fields-header" aria-hidden="true"><span>항목 이름</span><span>입력 유형</span><span class="wh-column-center">필수</span><span class="wh-column-center">순서</span><span class="wh-column-center">관리</span></div><div id="wh-field-list"></div></div><p id="wh-schema-error" class="wh-error" role="alert"></p>
    <div class="wh-row" style="margin-top:16px"><button type="button" id="wh-field-add">＋ 항목 추가</button></div>
    <p class="wh-muted">선택 항목을 삭제해도 기존 내역의 값은 보존됩니다.</p></form>`;
  if(!schemaDraft)schemaDraft=activeFields().map(f=>({...f,options:[...(f.options||[])]}));
  const draft=schemaDraft;
  const typeName = type => ({text:'텍스트', number:'숫자', date:'날짜', select:'드롭다운', upload:'업로드'}[type] || type);
  const error = text => { $('#wh-schema-error').textContent = text; toast(''); };
  function drawPreview() {
    $('#wh-field-count').textContent = draft.length + '개 기본 항목';
    const preview = $('#wh-preview-row');
    preview.innerHTML=previewTable(draft);
  }
  function drawFields() {
    $('#wh-field-list').innerHTML = draft.map((f,i) => {
      const options = ['date','number','text','select','upload'];
      return `<section class="wh-field-editor"><div class="wh-field-row">
        <input aria-label="항목 이름" data-field="${i}" value="${esc(f.name)}" required>
        <select aria-label="입력 유형" data-type="${i}">${options.map(type=>'<option value="'+type+'">'+typeName(type)+'</option>').join('')}</select>
        <div class="wh-column-center"><input aria-label="필수 입력 여부" type="checkbox" data-required="${i}" ${f.required?'checked':''}></div>
        <div class="wh-gap wh-order"><button type="button" data-up="${i}" ${i===0?'disabled':''} aria-label="항목 위로">↑</button><button type="button" data-down="${i}" ${i===draft.length-1?'disabled':''} aria-label="항목 아래로">↓</button></div><button type="button" data-remove-field="${i}">삭제</button></div>
        ${f.type==='select'?`<div class="wh-options"><div class="wh-row"><h3>선택 항목</h3><span class="wh-muted">${f.options.length}개</span></div>
        ${f.options.map((option,j)=>`<div class="wh-option-row"><input aria-label="선택 항목 ${j+1}" data-option-field="${i}" data-option-index="${j}" value="${esc(option)}" placeholder="선택 항목 이름" required><button type="button" data-remove-option="${i}" data-option-index="${j}" aria-label="선택 항목 ${j+1} 삭제">삭제</button></div>`).join('')}
        <button type="button" data-add-option="${i}">＋ 선택 항목 추가</button></div>`:''}</section>`;
    }).join('');
    draft.forEach((f,i) => {
      $(`[data-type="${i}"]`).value = f.type;
      $(`[data-field="${i}"]`).oninput = e => { f.name = e.target.value; error(''); drawPreview(); };
      $(`[data-type="${i}"]`).onchange = e => {
        f.type = e.target.value;
        if (f.type === 'select' && !f.options.length) {
          f.options = [...new Set(board().records.map(r=>String(r[f.id]??'')).filter(Boolean))];
          if (!f.options.length) f.options = ['선택 항목 1', '선택 항목 2'];
        }
        error(''); drawFields();
      };
      $(`[data-required="${i}"]`).onchange = e => { f.required = e.target.checked; drawPreview(); };
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
      input.oninput = e => { draft[Number(input.dataset.optionField)].options[Number(input.dataset.optionIndex)] = e.target.value; error(''); drawPreview(); };
    });
    root.querySelectorAll('[data-remove-option]').forEach(button => {
      button.onclick = () => { draft[Number(button.dataset.removeOption)].options.splice(Number(button.dataset.optionIndex),1); error(''); drawFields(); };
    });
    drawPreview();
  }
  drawFields();
  $('#wh-field-add').onclick = () => { draft.push({id:'custom'+Date.now()+'_'+draft.length,name:'새 항목',type:'text',required:false,options:[]}); drawFields(); };
  $('#wh-schema').onsubmit=event=>{event.preventDefault();if(pageEditing && commitSchemaDraft())finishPageEdit()};
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
  const active=activeFields();
  columnFilters=Object.fromEntries(Object.entries(columnFilters).filter(([id])=>active.some(field=>field.id===id && field.type==='select')));
  if(columnSort.id!=='id'&&!active.some(field=>field.id===columnSort.id&&field.type!=='select'))columnSort={id:'id',direction:'desc'};
  schemaDraft=null;
  return true;
}

function history(){panel.innerHTML=`<div class="wh-row"><h3>모든 변경 기록</h3><span class="wh-muted">${board().history.length}개 기록 · 최신순</span></div>${board().history.length?board().history.map(h=>`<article class="wh-event"><div class="wh-muted">${esc(h.time)}<br>${esc(h.who)}</div><div><h3>${esc(h.title)}</h3><p style="margin-top:5px;overflow-wrap:anywhere" class="wh-muted">${esc(h.detail)}</p></div></article>`).join(''):'<div class="wh-detail wh-muted">아직 변경 기록이 없습니다.</div>'}`;}
$('#wh-new-board').onclick=()=>{panel.innerHTML=`<form id="wh-create"><h3>새 업무 양식 만들기</h3><div class="wh-form-grid"><label>양식 이름 *<input name="name" placeholder="예: 출장비 정산" required maxlength="40"></label><label>설명<input name="desc" placeholder="관리할 업무를 간단히 적어 주세요."></label></div><div class="wh-row"><button type="button" id="wh-back">취소</button><button type="submit" class="wh-primary">만들고 항목 설정</button></div></form>`;$('#wh-back').onclick=render;$('#wh-create').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=f.get('name').trim();if(!name)return;if(state.boards.some(b=>b.name===name)){toast('같은 이름의 업무 양식이 있습니다.');return}state.boards.push({name,desc:f.get('desc')||'새로운 업무 양식입니다.',fields:[],records:[],history:[]});state.board=state.boards.length-1;tab='schema';pageEditing=true;schemaDraft=null;recordScreen=null;query='';columnSort={id:'id',direction:'desc'};columnFilters={};log('양식 생성',name);save();render()};};
root.addEventListener('click',e=>{const b=e.target.closest('[data-board]'),t=e.target.closest('[data-tab]'),r=e.target.closest('[data-record]');if(b){pageEditing=false;schemaDraft=null;recordScreen=null;state.board=Number(b.dataset.board);query='';columnSort={id:'id',direction:'desc'};columnFilters={};tab='list';render();save()}if(t){recordScreen=null;tab=t.dataset.tab;render();save()}if(r){recordScreen=Number(r.dataset.record);render();}const attachment=e.target.closest('[data-open-attachment]');if(attachment){e.preventDefault();window.workhubFiles.open(attachment.dataset.openAttachment).catch(error=>toast(error.message));}});
window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState){hydrate(e.detail.globals.widgetState);render()}});
render();
if(globalThis.Tweak){const appearance={density:'편안하게'};const tweak=new Tweak({container:root,onChange:()=>root.style.setProperty('--wh-cell',appearance.density==='촘촘하게'?'9px':'13px')});tweak.addSelect(appearance,'density',{label:'표 간격',options:['편안하게','촘촘하게']});}
})();

