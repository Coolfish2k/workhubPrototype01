// Standalone demo persistence. No server or shared database is connected.
const storageKey = 'workhub-record-view-test-v1';
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
let state={board:0,boards:[{name:'카드 사용 내역',desc:'사용 내역과 증빙을 건별로 모아 관리합니다.',fields:baseFields(),records:[{id:1024,date:'2026-11-02',owner:'김서연',dept:'경영지원부',memo:'11월 사무용품 구매',status:'확인 대기',items:[{name:'복사용지 A4',amount:32000},{name:'잉크 카트리지',amount:58000}]},{id:1023,date:'2026-10-30',owner:'이도현',dept:'교육부',memo:'신입사원 교육',status:'확인 완료',items:[{name:'교육 교재',amount:108500}]},{id:1022,date:'2026-10-29',owner:'박지은',dept:'경영지원부',memo:'외부 미팅',status:'확인 대기',items:[{name:'회의실 대여',amount:60000},{name:'다과',amount:22500},{name:'주차비',amount:8000}]},{id:1021,date:'2026-10-28',owner:'최민수',dept:'운영부',memo:'지점 장비 구매',status:'확인 완료',items:[{name:'모니터',amount:249000}]},{id:1020,date:'2026-10-27',owner:'김서연',dept:'경영지원부',memo:'',status:'확인 완료',items:[{name:'택배비',amount:6500}]}],history:[{time:'2026.11.02 09:42',who:'김서연',title:'#1024 등록',detail:'상세 내역 2개 · 90,000원'},{time:'2026.10.30 15:10',who:'관리자',title:'#1023 상태 변경',detail:'확인 대기 → 확인 완료'},{time:'2026.10.27 10:00',who:'관리자',title:'양식 생성',detail:'카드 사용 내역 · 기본 항목 4개'}]},{name:'지연 사유 관리',desc:'업무별 지연 사유와 조치 내용을 기록합니다.',fields:[{id:'date',name:'발생일',type:'date',required:true},{id:'owner',name:'담당자',type:'text',required:true},{id:'memo',name:'지연 사유',type:'text',required:true}],records:[],history:[]}]};
let tab='list',query='',status='',sort='new',editing=null;
function hydrate(s){if(s?.privateContent?.state?.boards?.length){state=s.privateContent.state;tab=s.privateContent.tab||'list';}}
hydrate(window.openai?.widgetState);
function save(){const snapshot={modelContent:{board:board().name,view:tab,recordCount:board().records.length,fields:activeFields().map(f=>f.name)},privateContent:{state,tab}};window.openai?.setWidgetState(snapshot)?.catch(()=>toast('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.'));}
function board(){return state.boards[state.board]||state.boards[0]}
function log(title,detail){board().history.unshift({time:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Seoul'}).slice(0,16),who:'관리자 (예시)',title,detail});}
function toast(t){$('#wh-toast').textContent=t}
function shell(){ $('#wh-title').textContent=board().name;$('#wh-desc').textContent=board().desc;$('#wh-boards').innerHTML=state.boards.map((b,i)=>`<button class="wh-board ${i===state.board?'selected':''}" data-board="${i}">▦ <span>${esc(b.name)}</span></button>`).join('');root.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab)});panel.setAttribute('aria-labelledby','wh-tab-'+tab);}
function render(){shell();if(tab==='list')list();if(tab==='schema')schema();if(tab==='history')history();}
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
  return board().records.filter(record=>(!status || record.status===status) && (!query ||
    [String(record.id),record.status,...activeFields().map(field=>fieldText(field,record))].join(' ').toLowerCase().includes(query.toLowerCase())
  )).sort((a,b)=>sort==='old'?a.id-b.id:b.id-a.id);
}
function total(record){return (record.items||[]).reduce((sum,item)=>sum+Number(item.amount||0),0)}
function dataRows(){
  const records=rows(),fields=activeFields();
  $('#wh-body').innerHTML=records.length?records.map(record=>'<tr><td><button class="wh-link" data-record="'+record.id+'">#'+record.id+'</button></td>'+fields.map(field=>'<td'+(field.type==='number'?' class="wh-amount"':'')+'>'+fieldValue(field,record)+'</td>').join('')+'<td><span class="wh-badge">'+esc(record.status||'확인 대기')+'</span></td></tr>').join(''):
    '<tr><td colspan="'+(fields.length+2)+'" style="text-align:center;padding:36px">조건에 맞는 데이터가 없습니다.</td></tr>';
  $('#wh-count').textContent=records.length+'건';
}
function list(){
  panel.innerHTML='<div class="wh-row"><span class="wh-muted">전체 '+board().records.length+'건</span><button class="wh-primary" id="wh-add">＋ 내역 작성</button></div>'+
    '<div class="wh-filters"><input aria-label="내역 검색" id="wh-search" placeholder="내역 검색" value="'+esc(query)+'"><select aria-label="상태 필터" id="wh-status"><option value="">전체 상태</option><option>확인 대기</option><option>확인 완료</option></select><select aria-label="정렬" id="wh-sort"><option value="new">등록 최신순</option><option value="old">등록 오래된순</option></select></div>'+
    '<div class="wh-table-wrap"><table aria-label="내역 목록"><thead><tr><th>등록 번호</th>'+activeFields().map(field=>'<th scope="col">'+esc(field.name)+'</th>').join('')+'<th>상태</th></tr></thead><tbody id="wh-body"></tbody></table></div><div class="wh-foot"><span id="wh-count"></span></div>';
  if(!['old','new'].includes(sort))sort='new';
  $('#wh-status').value=status;$('#wh-sort').value=sort;dataRows();
  $('#wh-search').oninput=e=>{query=e.target.value;dataRows()};
  $('#wh-status').onchange=e=>{status=e.target.value;dataRows()};
  $('#wh-sort').onchange=e=>{sort=e.target.value;dataRows()};
  $('#wh-add').onclick=()=>recordForm(null);
}
function recordView(id){
  editing=null;
  const record=board().records.find(record=>record.id===id);
  if(!record){render();return;}
  panel.innerHTML='<div class="wh-row"><h3>#'+id+'</h3><div class="wh-gap"><button type="button" id="wh-view-back">목록으로</button><button type="button" class="wh-primary" id="wh-view-edit">수정</button></div></div>'+
    '<dl class="wh-record-view">'+activeFields().map(field=>'<div><dt>'+esc(field.name)+'</dt><dd>'+fieldValue(field,record)+'</dd></div>').join('')+'<div><dt>상태</dt><dd><span class="wh-badge">'+esc(record.status||'확인 대기')+'</span></dd></div></dl>'+
    ((record.items||[]).length?'<div class="wh-detail"><h3>상세 내역</h3><div class="wh-table-wrap"><table><thead><tr><th>항목명</th><th class="wh-amount">금액</th></tr></thead><tbody>'+record.items.map(item=>'<tr><td>'+esc(item.name)+'</td><td class="wh-amount">'+money(item.amount)+'</td></tr>').join('')+'</tbody></table></div></div>':'');
  $('#wh-view-back').onclick=render;
  $('#wh-view-edit').onclick=()=>recordForm(id);
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
  editing=id;
  const original=id?board().records.find(record=>record.id===id):null;
  const record=original||{date:'2026-11-02',owner:'',dept:'',memo:'',status:'확인 대기',items:[{name:'',amount:0}]};
  panel.innerHTML='<form id="wh-record-form"><div class="wh-row"><h3>'+(id?'#'+id+' 수정':'새 내역 작성')+'</h3><button type="button" id="wh-cancel">취소</button></div><div class="wh-form-grid">'+activeFields().map(field=>recordField(field,record)).join('')+
    '<label>상태<select name="status"><option'+(record.status==='확인 대기'?' selected':'')+'>확인 대기</option><option'+(record.status==='확인 완료'?' selected':'')+'>확인 완료</option></select></label></div>'+
    '<div class="wh-detail"><div class="wh-row"><h3>상세 내역</h3></div><div class="wh-table-wrap"><table><thead><tr><th>항목명 *</th><th>금액 (원) *</th><th>관리</th></tr></thead><tbody id="wh-items"></tbody></table></div><div class="wh-row" style="margin-top:12px"><button type="button" id="wh-add-item">＋ 상세 행 추가</button><span id="wh-sum"></span></div></div><div class="wh-row"><span></span><button type="submit" class="wh-primary">'+(id?'변경 저장':'등록하기')+'</button></div></form>';
  const form=$('#wh-record-form');bindUploadControls(form);
  const itemBody=$('#wh-items');
  function sum(){$('#wh-sum').textContent='합계 '+money([...itemBody.querySelectorAll('[data-amount]')].reduce((sum,input)=>sum+Number(input.value),0))}
  function addItem(item){
    const row=document.createElement('tr');
    row.innerHTML='<td><input aria-label="상세 항목명" data-item-name value="'+esc(item.name)+'" required></td><td><input aria-label="금액" data-amount type="number" min="0" step="1" value="'+Number(item.amount)+'" required></td><td><button type="button" aria-label="상세 행 삭제">삭제</button></td>';
    row.querySelector('button').onclick=()=>{if(itemBody.children.length>1){row.remove();sum()}else toast('상세 내역은 1개 이상 필요합니다.')};
    row.querySelector('[data-amount]').oninput=sum;itemBody.appendChild(row);sum();
  }
  (record.items||[]).forEach(addItem);
  $('#wh-add-item').onclick=()=>addItem({name:'',amount:0});
  $('#wh-cancel').onclick=()=>id?recordView(id):render();
  form.onsubmit=event=>{
    event.preventDefault();if(!validateUploads(form))return;
    // Preserve values belonging to removed/inactive fields.
    const data={...(original||{}),...Object.fromEntries(new FormData(form))};
    data.items=[...itemBody.children].map(row=>({name:row.querySelector('[data-item-name]').value.trim(),amount:Number(row.querySelector('[data-amount]').value)}));
    if(data.items.some(item=>!item.name)){toast('상세 항목명을 입력해 주세요.');return;}
    data.id=id||Math.max(1000,...board().records.map(record=>record.id))+1;
    if(id){
      const changes=activeFields().filter(field=>String(record[field.id]??'')!==String(data[field.id]??'')).map(field=>field.name+': '+fieldText(field,record)+' → '+fieldText(field,data));
      if(record.status!==data.status)changes.push('상태: '+record.status+' → '+data.status);
      if(JSON.stringify(record.items||[])!==JSON.stringify(data.items))changes.push('상세 내역 변경');
      if(changes.length){board().records[board().records.findIndex(record=>record.id===id)]=data;log('#'+id+' 수정',changes.join(' / '));}
    }else{board().records.unshift(data);log('#'+data.id+' 등록','내역 등록');}
    save();recordView(data.id);toast('저장했습니다.');
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
  panel.innerHTML = `<section class="wh-schema-preview" aria-labelledby="wh-preview-title"><div class="wh-row"><h3 id="wh-preview-title">미리보기</h3><span class="wh-muted">예시 데이터</span></div><div id="wh-preview-row" class="wh-table-wrap"></div></section>
    <div class="wh-row"><div><h3>입력 항목 설정</h3><p class="wh-muted" style="margin-top:4px">날짜·숫자·텍스트·드롭다운·업로드 중 선택할 수 있습니다.</p></div><span id="wh-field-count" class="wh-badge">${board().fields.length}개 기본 항목</span></div>
    <form id="wh-schema"><div class="wh-schema-fields"><div class="wh-fields-header" aria-hidden="true"><span>항목 이름</span><span>입력 유형</span><span class="wh-column-center">필수</span><span class="wh-column-center">순서</span><span class="wh-column-center">관리</span></div><div id="wh-field-list"></div></div><p id="wh-schema-error" class="wh-error" role="alert"></p>
    <div class="wh-row" style="margin-top:16px"><button type="button" id="wh-field-add">＋ 항목 추가</button><button class="wh-primary" type="submit">양식 저장</button></div>
    <div class="wh-detail"><h3>반복 입력 영역 · 상세 내역</h3><p class="wh-muted" style="margin-top:6px">항목명 + 금액 · 등록 한 건에 여러 행 추가 가능 · 합계 자동 표시</p></div>
    <p class="wh-muted">선택 항목을 삭제해도 기존 내역의 값은 보존됩니다.</p></form>`;
  let draft = activeFields().map(f => ({...f, options: [...(f.options || [])]}));
  const typeName = type => ({text:'텍스트', number:'숫자', date:'날짜', select:'드롭다운', upload:'업로드'}[type] || type);
  const error = text => { $('#wh-schema-error').textContent = text; toast(''); };
  function drawPreview() {
    $('#wh-field-count').textContent = draft.length + '개 기본 항목';
    const preview = $('#wh-preview-row');
    const sample = f => {
      if (f.type === 'upload') return '첨부파일.pdf';
      if (f.type === 'select') return f.options.find(option=>option.trim()) || '—';
      if (f.type === 'date') return '2026-11-02';
      if (f.type === 'number') return '1,000';
      return {owner:'홍길동',dept:'경영지원부',memo:'사무용품 구매'}[f.id] || '예시 내용';
    };
    preview.innerHTML = `<table aria-label="입력 양식 한 행 미리보기"><thead><tr>${draft.map(f=>`<th scope="col">${esc(f.name || '항목 이름')}</th>`).join('')}</tr></thead><tbody><tr>${draft.map(f=>`<td${f.type==='number'?' class="wh-preview-number"':''}>${esc(sample(f))}</td>`).join('')}</tr></tbody></table>`;
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
  $('#wh-schema').onsubmit = e => {
    e.preventDefault();
    const next = draft.map(f=>({...f,active:true,name:f.name.trim(),options:f.type==='select'?f.options.map(o=>o.trim()):[]}));
    if (next.some(f=>!f.name)) return error('항목 이름을 입력해 주세요.');
    if (new Set(next.map(f=>f.name)).size!==next.length) return error('항목 이름은 중복될 수 없습니다.');
    for (const f of next.filter(f=>f.type==='select')) {
      if (!f.options.length || f.options.some(o=>!o)) return error(f.name+': 선택 항목을 1개 이상 입력해 주세요.');
      if (new Set(f.options).size!==f.options.length) return error(f.name+': 선택 항목 이름은 중복될 수 없습니다.');
    }
    const old=board().fields;
    const changes=next.flatMap(f=>{
      const prev=old.find(x=>x.id===f.id);
      if(!prev) return ['항목 추가: '+f.name+' ('+typeName(f.type)+')',...(f.type==='select'?['선택 항목: '+f.options.join(', ')]:[])];
      return [
        ...(prev.name!==f.name?['항목명: '+prev.name+' → '+f.name]:[]),
        ...(prev.type!==f.type?['입력 유형: '+f.name+' · '+typeName(prev.type)+' → '+typeName(f.type)]:[]),
        ...(prev.required!==f.required?[f.name+' 필수 여부: '+(prev.required?'필수':'선택')+' → '+(f.required?'필수':'선택')]:[]),
        ...(JSON.stringify(prev.options||[])!==JSON.stringify(f.options)?[f.name+' 선택 항목: '+((prev.options||[]).join(', ')||'없음')+' → '+(f.options.join(', ')||'없음')]:[])
      ];
    });
    const removed=old.filter(field=>field.active!==false && !next.some(current=>current.id===field.id));
    changes.push(...removed.map(field=>'항목 제거: '+field.name));
    if(old.filter(field=>field.active!==false).map(f=>f.id).join()!==next.map(f=>f.id).join()) changes.push('항목 구성·순서 변경');
    if(changes.length){board().fields=[...next,...old.filter(field=>!next.some(current=>current.id===field.id)).map(field=>({...field,active:false}))];log('양식 변경',changes.join(' / '));save();}
    render();toast('양식을 저장했습니다. 내역 작성·수정 화면에 반영됩니다.');
  };
}
function history(){panel.innerHTML=`<div class="wh-row"><h3>모든 변경 기록</h3><span class="wh-muted">${board().history.length}개 기록 · 최신순</span></div>${board().history.length?board().history.map(h=>`<article class="wh-event"><div class="wh-muted">${esc(h.time)}<br>${esc(h.who)}</div><div><h3>${esc(h.title)}</h3><p style="margin-top:5px;overflow-wrap:anywhere" class="wh-muted">${esc(h.detail)}</p></div></article>`).join(''):'<div class="wh-detail wh-muted">아직 변경 기록이 없습니다.</div>'}`;}
$('#wh-new-board').onclick=()=>{panel.innerHTML=`<form id="wh-create"><h3>새 업무 양식 만들기</h3><div class="wh-form-grid"><label>양식 이름 *<input name="name" placeholder="예: 출장비 정산" required maxlength="40"></label><label>설명<input name="desc" placeholder="관리할 업무를 간단히 적어 주세요."></label></div><div class="wh-row"><button type="button" id="wh-back">취소</button><button type="submit" class="wh-primary">만들고 항목 설정</button></div></form>`;$('#wh-back').onclick=render;$('#wh-create').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),name=f.get('name').trim();if(!name)return;if(state.boards.some(b=>b.name===name)){toast('같은 이름의 업무 양식이 있습니다.');return}state.boards.push({name,desc:f.get('desc')||'새로운 업무 양식입니다.',fields:baseFields(),records:[],history:[]});state.board=state.boards.length-1;tab='schema';query='';status='';log('양식 생성',name);save();render()};};
root.addEventListener('click',e=>{const b=e.target.closest('[data-board]'),t=e.target.closest('[data-tab]'),r=e.target.closest('[data-record]');if(b){state.board=Number(b.dataset.board);query='';status='';tab='list';render();save()}if(t){tab=t.dataset.tab;render();save()}if(r)recordView(Number(r.dataset.record));const attachment=e.target.closest('[data-open-attachment]');if(attachment){e.preventDefault();window.workhubFiles.open(attachment.dataset.openAttachment).catch(error=>toast(error.message));}});
window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState){hydrate(e.detail.globals.widgetState);render()}});
render();
if(globalThis.Tweak){const appearance={density:'편안하게'};const tweak=new Tweak({container:root,onChange:()=>root.style.setProperty('--wh-cell',appearance.density==='촘촘하게'?'9px':'13px')});tweak.addSelect(appearance,'density',{label:'표 간격',options:['편안하게','촘촘하게']});}
})();


