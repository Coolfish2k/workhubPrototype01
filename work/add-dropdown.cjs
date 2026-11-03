const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../workhub-source');
const appPath = path.join(dir, 'app.js');
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace("try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}", "localStorage.setItem(storageKey, JSON.stringify(state));");
app = app.replace("if(JSON.stringify(snapshot).length<15000)window.openai?.setWidgetState(snapshot)?.catch(()=>{});", "window.openai?.setWidgetState(snapshot)?.catch(()=>toast('브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.'));");
const helper = `function fieldControl(f, record) {
  const value = String(record[f.id] ?? '');
  const attributes = 'name="' + esc(f.id) + '"' + (f.required ? ' required' : '');
  if (f.type !== 'select') return '<input ' + attributes + ' type="' + esc(f.type) + '" value="' + esc(value) + '">';
  const choices = Array.isArray(f.options) ? f.options : [];
  // Keep a previously saved value selectable even after an option is removed.
  const legacy = value && !choices.includes(value)
    ? '<option value="' + esc(value) + '" selected>' + esc(value) + ' (이전 값)</option>' : '';
  return '<select ' + attributes + '><option value="">선택해 주세요</option>' + legacy + choices.map(option =>
    '<option value="' + esc(option) + '"' + (option === value ? ' selected' : '') + '>' + esc(option) + '</option>'
  ).join('') + '</select>';
}
`;
app = app.replace('function recordForm(id)', helper + 'function recordForm(id)');
const oldInput = '<input name="${esc(f.id)}" type="${f.type}" value="${esc(r[f.id]||\'\')}" ${f.required?\'required\':\'\'}>';
if (!app.includes(oldInput)) throw new Error('Record form input was not found');
app = app.replace(oldInput, '${fieldControl(f,r)}');
const schema = `function schema() {
  panel.innerHTML = \`<div class="wh-row"><div><h3>입력 항목 설정</h3><p class="wh-muted" style="margin-top:4px">입력 유형에서 드롭다운을 선택하면 선택 항목을 추가·삭제할 수 있습니다.</p></div><span class="wh-badge">\${board().fields.length}개 기본 항목</span></div>
    <form id="wh-schema"><div id="wh-field-list"></div><p id="wh-schema-error" class="wh-error" role="alert"></p>
    <div class="wh-row" style="margin-top:16px"><button type="button" id="wh-field-add">＋ 항목 추가</button><button class="wh-primary" type="submit">양식 저장</button></div>
    <div class="wh-detail"><h3>반복 입력 영역 · 상세 내역</h3><p class="wh-muted" style="margin-top:6px">항목명 + 금액 · 등록 한 건에 여러 행 추가 가능 · 합계 자동 표시</p></div>
    <p class="wh-muted">선택 항목을 삭제해도 기존 내역의 값은 보존됩니다. 기존 날짜·숫자 항목의 형식은 유지합니다.</p></form>\`;
  let draft = board().fields.map(f => ({...f, options: [...(f.options || [])]}));
  const typeName = type => ({text:'텍스트', number:'숫자', date:'날짜', select:'드롭다운'}[type] || type);
  const error = text => { $('#wh-schema-error').textContent = text; };
  function drawFields() {
    $('#wh-field-list').innerHTML = draft.map((f,i) => {
      const previous = board().fields.find(x => x.id === f.id);
      const locked = previous && ['date','number'].includes(previous.type);
      const options = previous ? [previous.type, ...(['text','select'].includes(previous.type) ? ['text','select'] : [])] : ['text','number','date','select'];
      return \`<section class="wh-field-editor"><div class="wh-field-row">
        <label>항目 이름<input aria-label="항목 이름" data-field="\${i}" value="\${esc(f.name)}" required></label>
        <label>입력 유형<select aria-label="입력 유형" data-type="\${i}" \${locked?'disabled':''}>\${[...new Set(options)].map(type=>'<option value="'+type+'">'+typeName(type)+'</option>').join('')}</select></label>
        <label class="wh-check"><input type="checkbox" data-required="\${i}" \${f.required?'checked':''}>필수</label>
        <div class="wh-gap"><button type="button" data-up="\${i}" \${i===0?'disabled':''} aria-label="항목 위로">↑</button></div></div>
        \${f.type==='select'?\`<div class="wh-options"><div class="wh-row"><h3>선택 항목</h3><span class="wh-muted">\${f.options.length}개</span></div>
        \${f.options.map((option,j)=>\`<div class="wh-option-row"><input aria-label="선택 항목 \${j+1}" data-option-field="\${i}" data-option-index="\${j}" value="\${esc(option)}" placeholder="선택 항목 이름" required><button type="button" data-remove-option="\${i}" data-option-index="\${j}" aria-label="선택 항목 \${j+1} 삭제">삭제</button></div>\`).join('')}
        <button type="button" data-add-option="\${i}">＋ 선택 항목 추가</button></div>\`:''}</section>\`;
    }).join('');
    draft.forEach((f,i) => {
      $(\`[data-type="\${i}"]\`).value = f.type;
      $(\`[data-field="\${i}"]\`).oninput = e => { f.name = e.target.value; error(''); };
      $(\`[data-type="\${i}"]\`).onchange = e => {
        f.type = e.target.value;
        if (f.type === 'select' && !f.options.length) {
          f.options = [...new Set(board().records.map(r=>String(r[f.id]??'')).filter(Boolean))];
          if (!f.options.length) f.options = ['선택 항목 1', '선택 항목 2'];
        }
        error(''); drawFields();
      };
      $(\`[data-required="\${i}"]\`).onchange = e => f.required = e.target.checked;
      $(\`[data-up="\${i}"]\`).onclick = () => { [draft[i-1],draft[i]]=[draft[i],draft[i-1]]; drawFields(); };
      if (f.type === 'select') {
        $(\`[data-add-option="\${i}"]\`).onclick = () => {
          f.options.push(''); error(''); drawFields();
          $(\`[data-option-field="\${i}"][data-option-index="\${f.options.length-1}"]\`).focus();
        };
      }
    });
    root.querySelectorAll('[data-option-field]').forEach(input => {
      input.oninput = e => { draft[Number(input.dataset.optionField)].options[Number(input.dataset.optionIndex)] = e.target.value; error(''); };
    });
    root.querySelectorAll('[data-remove-option]').forEach(button => {
      button.onclick = () => { draft[Number(button.dataset.removeOption)].options.splice(Number(button.dataset.optionIndex),1); error(''); drawFields(); };
    });
  }
  drawFields();
  $('#wh-field-add').onclick = () => { draft.push({id:'custom'+Date.now()+'_'+draft.length,name:'새 항목',type:'text',required:false,options:[]}); drawFields(); };
  $('#wh-schema').onsubmit = e => {
    e.preventDefault();
    const next = draft.map(f=>({...f,name:f.name.trim(),options:f.type==='select'?f.options.map(o=>o.trim()):[]}));
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
    if(old.map(f=>f.id).join()!==next.map(f=>f.id).join()) changes.push('항목 구성·순서 변경');
    if(changes.length){board().fields=next;log('양식 변경',changes.join(' / '));save();}
    render();toast('양식을 저장했습니다. 내역 작성·수정 화면에 반영됩니다.');
  };
}
`.replace('항目 이름','항목 이름');
const start = app.indexOf('function schema()');
const end = app.indexOf('function history()', start);
if (start < 0 || end < 0) throw new Error('Schema function was not found');
app = app.slice(0,start)+schema+app.slice(end);
fs.writeFileSync(appPath,app);
fs.appendFileSync(path.join(dir,'styles.css'), `
/* Dropdown option editor */
#workhub-proto .wh-options { margin: 0 0 16px; padding: 14px; background: var(--wh-bg); border-radius: 8px; }
#workhub-proto .wh-options h3 { font-size: 12px; }
#workhub-proto .wh-option-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; margin: 10px 0; }
#workhub-proto .wh-options > button { margin-top: 4px; }
#workhub-proto .wh-field-row { align-items: end; }
#workhub-proto .wh-field-row > .wh-check, #workhub-proto .wh-field-row > .wh-gap { align-self: center; }
#workhub-proto #wh-schema-error:not(:empty) { margin-top: 12px; }
`);
let readme=fs.readFileSync(path.join(dir,'README.md'),'utf8');
readme += '\n\n## 드롭다운 선택 항목 관리\n\n양식 설정 → 항목 추가 → 입력 유형: 드롭다운 → 선택 항목을 입력하고 양식 저장. 선택 항목 추가 및 각 행의 삭제 버튼으로 목록을 관리합니다. 텍스트 항목도 드롭다운으로 전환할 수 있습니다. 빈 항목과 중복 선택 항목은 저장할 수 없습니다. 삭제된 선택 항목으로 저장된 기존 값은 수정 화면에서 (이전 값)으로 표시하며 보존합니다.\n';
fs.writeFileSync(path.join(dir,'README.md'),readme);
console.log('Updated app.js, styles.css and README.md');
