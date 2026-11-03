const fs=require('node:fs');
const path=require('node:path');
const filename=path.resolve(__dirname,'../workhub-source/app.js');
let app=fs.readFileSync(filename,'utf8');
app=app.replace('function rows(){', 'function activeFields(){return board().fields.filter(field=>field.active!==false)}\nfunction rows(){');
// Existing records retain their original field IDs and values when fields are hidden.
app=app.replaceAll('board().fields.map(', 'activeFields().map(');
app=app.replaceAll('board().fields.filter(', 'activeFields().filter(');
app=app.replace('function activeFields(){return activeFields().filter(field=>field.active!==false)}','function activeFields(){return board().fields.filter(field=>field.active!==false)}');
function replaceFunctionBlock(start,end,text){const a=app.indexOf(start),b=app.indexOf(end,a);if(a<0||b<0)throw new Error('Missing block: '+start);app=app.slice(0,a)+text+'\n'+app.slice(b);}
replaceFunctionBlock('function rows(){','function fieldControl(',String.raw`function fieldText(field,record) {
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
`);
replaceFunctionBlock('function recordForm(id)','function recordField(',String.raw`function recordForm(id){
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
`);
// Removing a schema field deactivates its column; its stored values are retained.
app=app.replace('<span class="wh-column-center">순서</span></div>', '<span class="wh-column-center">순서</span><span class="wh-column-center">관리</span></div>');
app=app.replace('aria-label="항목 아래로">↓</button></div></div>', 'aria-label="항목 아래로">↓</button></div><button type="button" data-remove-field="${i}">삭제</button></div>');
app=app.replace("$(`[data-up=\"${i}\"]`).onclick", "$(`[data-remove-field=\"${i}\"]`).onclick=()=>{draft.splice(i,1);error('');drawFields();};\n      $(`[data-up=\"${i}\"]`).onclick");
app=app.replace("({...f,name:f.name.trim(),options:f.type==='select'?f.options.map(o=>o.trim()):[]})", "({...f,active:true,name:f.name.trim(),options:f.type==='select'?f.options.map(o=>o.trim()):[]})");
app=app.replace("if(old.map(f=>f.id).join()!==next.map(f=>f.id).join())", "const removed=old.filter(field=>field.active!==false && !next.some(current=>current.id===field.id));\n    changes.push(...removed.map(field=>'항목 제거: '+field.name));\n    if(old.filter(field=>field.active!==false).map(f=>f.id).join()!==next.map(f=>f.id).join())");
app=app.replace('board().fields=next;log(', 'board().fields=[...next,...old.filter(field=>!next.some(current=>current.id===field.id)).map(field=>({...field,active:false}))];log(');
app=app.replace('if(r)recordForm(Number(r.dataset.record));', "if(r)recordView(Number(r.dataset.record));const attachment=e.target.closest('[data-open-attachment]');if(attachment){e.preventDefault();window.workhubFiles.open(attachment.dataset.openAttachment).catch(error=>toast(error.message));}");
fs.writeFileSync(filename,app);
console.log('Updated view/edit modes and active schema rendering.');
