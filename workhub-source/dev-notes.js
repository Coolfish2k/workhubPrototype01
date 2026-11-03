// Developer notes layer. Only reads the page and adds pins, so removing this file removes every note.
// 화면만 봐서는 알 수 없는 동작과 데이터 규칙만 적습니다.
// 개발자가 읽는 글입니다. 간결하게 쓰되 AND, OR, deletedAt 같은 기술 용어는 그대로 씁니다.
// must: 요구사항 / example: 데이터 예시 / now: 현재 동작 / ask: 개발 시 필요
(() => {
const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><defs><filter id="comment-icon-shadow" x="0" y="0" width="96" height="96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#141e19" flood-opacity="0.18"/></filter></defs><circle cx="48" cy="46" r="32" fill="#ffffff" filter="url(#comment-icon-shadow)"/><g transform="translate(30 28) scale(1.5)" stroke="#1d2822" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></g></svg>`;
const pinSrc = 'data:image/svg+xml,' + encodeURIComponent(pinSvg);

const notes = [
  /* 데이터 목록 */
  { screen: '데이터 목록', anchor: '[data-sort-head="id"]', title: '저장 구조', must: [
    '내역 = 등록 번호 1개 + 줄 1개 이상. 한 줄짜리 내역도 lines에 1개로 저장합니다.',
    '항목 값은 모두 줄에 저장합니다. 내역에 직접 저장하지 않습니다.',
    'lineId는 내부 값이며 화면에 표시하지 않습니다.',
    '값을 단일 값과 여러 줄 값으로 나눠 이중 저장하지 않습니다.',
  ], example: `#1026
 ├ lineId a1: 항목 = 밥,   금액 = 5000
 └ lineId a2: 항목 = 커피, 금액 = 2000

#1027
 └ lineId b1: 항목 = 택시, 금액 = 12000`, now: [
    '구조: 양식(fields, records, history) → 내역(id, createdAt, deleted, deletedAt, lines) → 줄(lineId, deleted, deletedAt, 항목별 값).',
    'id는 max(id) + 1이며, deleted 내역도 포함해 계산하므로 번호를 재사용하지 않습니다.',
    '이전 형식의 내역은 로드 시 자동 변환합니다. 기존 값은 1번째 줄이 되고 옛 items 원본은 유지합니다.',
  ], ask: [
    '번호는 서버에서 발급해 주세요. 동시 등록 시 중복되면 안 됩니다.',
    '현재 저장소는 localStorage(내역), IndexedDB(첨부파일)입니다. 서버 DB로 교체가 필요합니다.',
  ] },
  { screen: '데이터 목록', anchor: '#wh-table [data-toggle-id]', title: '등록 번호·등록일 전환', must: [
    '등록일은 별도 열이 없습니다. 등록 번호 값을 누르면 모든 행이 createdAt 표시로 바뀌고, 다시 누르면 돌아옵니다.',
    '열 제목은 항상 "등록 번호"입니다.',
    'createdAt은 최초 저장 시각이며 입력·수정할 수 없습니다. 내역을 수정해도 바뀌지 않습니다.',
  ], now: [
    '날짜 표시 중에는 이 열의 정렬 기준이 createdAt입니다.',
    '표시 상태는 저장하지 않습니다. 새로고침하거나 양식을 바꾸면 등록 번호로 돌아옵니다.',
    '기존 내역의 createdAt은 "#번호 등록" 이력 시각을 사용하고, 이력이 없으면 null(— 표시)입니다.',
    '카드 사용 내역 #1020~1023의 createdAt은 임의의 예시 값입니다.',
  ], ask: [
    'createdAt은 브라우저가 아니라 서버 시각으로 기록해 주세요.',
  ] },
  { screen: '데이터 목록', anchor: '[data-sort-head]:not([data-sort-head="id"])', title: '열 정렬', now: [
    '빈 값은 정렬 방향과 무관하게 항상 뒤로 보냅니다.',
    '값이 같으면 id 오름차순입니다.',
    '줄마다 항목은 첫 번째 값 기준으로 정렬합니다. 내역은 줄 단위로 나뉘지 않습니다.',
  ] },
  { screen: '데이터 목록', anchor: '#wh-table thead th:has([data-filter-field])', title: '드롭다운 필터', now: [
    '같은 열 안의 선택값은 OR, 서로 다른 열 사이는 AND입니다.',
    '여러 줄 내역은 줄 중 하나만 맞아도 내역 전체를 표시합니다.',
    '선택 목록 = field.options + 실제 저장된 값.',
    '모두 체크한 상태는 필터 없음(null)으로 처리합니다.',
  ] },
  { screen: '데이터 목록', anchor: '#wh-table [data-delete-record]', title: '내역 삭제', must: [
    'Soft delete만 허용합니다. 값과 lines를 모두 보존하고, 이력을 남깁니다.',
  ], now: [
    'deleted = true, deletedAt = 삭제 시각을 기록합니다.',
    'deleted 내역은 목록, 건수, 합계, 검색, 필터에서 제외합니다.',
  ] },

  /* 내역 작성·수정 */
  { screen: '내역 작성·수정', anchor: '#wh-record-form .wh-form-grid', title: '입력값 보존', now: [
    'options에서 삭제된 값도 "(이전 값)"으로 선택지에 남겨 저장값을 유지합니다.',
    '숨긴 항목(active: false)의 값은 입력칸이 없어도 저장 시 유지합니다.',
  ] },
  { screen: '내역 작성·수정', anchor: '.wh-line-table', title: '줄별 입력', must: [
    '줄마다를 꺼도 기존 내역의 줄은 모두 표시하고 수정·삭제할 수 있어야 합니다.',
  ], now: [
    '꺼진 항목은 값이 있는 줄에만 입력칸을 표시합니다.',
  ] },
  { screen: '내역 작성·수정', anchor: '[data-add-line]', title: '줄 추가', must: [
    'field.multi가 true인 항목이 있을 때만 표시합니다.',
  ], now: [
    '새 줄의 값이 모두 비어 있으면 저장하지 않습니다.',
  ] },
  { screen: '내역 작성·수정', anchor: '[data-remove-line]', title: '줄 삭제', must: [
    'Soft delete입니다. 줄에 deleted, deletedAt을 기록하고 값을 보존하며 이력을 남깁니다.',
  ], now: [
    '내역에는 최소 1줄이 필요합니다.',
    '1번째 줄을 삭제하면 단일 입력 항목의 값은 다음 줄로 옮깁니다. 삭제된 줄에도 원래 값은 남습니다.',
  ] },
  { screen: '내역 작성·수정', anchor: '.wh-upload', title: '첨부파일', now: [
    '지원 브라우저는 FileSystemFileHandle을, 그 외에는 File 사본을 IndexedDB에 저장합니다. 서버 전송은 없습니다.',
    '파일을 옮기거나 지우면 다시 선택해야 하며, 읽기 권한을 다시 요청할 수 있습니다.',
    'PDF, text/plain, 이미지는 새 탭으로 열고 나머지는 다운로드합니다.',
  ], ask: [
    '서버 업로드와 저장소, 용량·형식 제한, 접근 권한이 필요합니다.',
  ] },
  { screen: '내역 작성·수정', anchor: '#wh-record-form [type="submit"]', title: '저장과 이력', now: [
    '변경이 없으면 이력을 남기지 않습니다.',
    '바뀐 값만 기록합니다. 예: "메모: 이전 → 이후", "2번째 줄 금액(원): 2,000 → 2,500", "줄 추가: 커피 · 2,000".',
  ] },
  { screen: '내역 작성·수정', anchor: '#wh-record-form [data-dialog-cancel]', title: '작성 내용 보호', must: [
    '작성 중인 내용을 확인 없이 잃으면 안 됩니다.',
  ], now: [
    '변경이 있으면 취소, X, Esc 모두 확인 창을 띄웁니다. 대화 상자 바깥 클릭으로는 닫히지 않습니다.',
  ] },

  /* 양식 설정 */
  { screen: '양식 설정 편집', anchor: '[data-field="0"]', title: '항목 이름', now: [
    '값은 field.id로 연결되므로 이름을 바꿔도 기존 값이 유지됩니다.',
    '양식 안에서 중복될 수 없고, 앞뒤 공백은 제거합니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '[data-type="0"]', title: '입력 유형 변경', now: [
    '유형을 바꿔도 저장된 값은 변환하거나 지우지 않습니다.',
    '드롭다운으로 바꾸면 저장된 값으로 options를 자동 생성합니다. 값이 없으면 "선택 항목 1, 2"로 시작합니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '[data-required="0"]', title: '필수 적용 범위', now: [
    '저장된 내역에는 소급 적용하지 않습니다.',
    'multi 항목은 줄마다 필수이며, multi를 끈 항목의 기존 줄에는 적용하지 않습니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '[data-multi="0"]', title: '줄마다', must: [
    'field.multi는 입력 화면만 결정합니다. 저장 데이터는 변환하지 않습니다.',
    '언제든 켜고 끌 수 있으며 막지 않습니다. 저장 시점부터 적용합니다.',
    '표는 저장된 줄을 그대로 표시합니다. 꺼도 기존의 여러 줄은 그대로 보이고, 새 내역은 입력칸 1개입니다.',
  ], now: [
    '꺼진 항목이라도 2번째 줄 이후에 값이 있으면 병합하지 않고 줄별로 표시합니다.',
    '저장 구조가 항상 같아서 몇 번을 전환해도 데이터가 손실되지 않습니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '[data-remove-field="0"]', title: '항목 삭제', must: [
    'Soft delete입니다. active: false로 숨기고 내역의 값은 보존하며 이력을 남깁니다.',
  ], now: [
    '숨긴 항목의 값은 표, 폼, 검색에서 제외합니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '.wh-options', title: '선택 항목 삭제', now: [
    'options에서 지워도 내역에 저장된 값은 유지합니다.',
    '빈 값과 중복은 저장할 수 없습니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '#wh-schema [type="submit"]', title: '설정 저장과 이력', now: [
    '실제 변경만 기록합니다: 항목 추가, 항목 제거, 항목 이름 변경, 줄마다 켬·끔, 항목 설정 변경, 항목 순서 변경, 양식 이름·설명 변경.',
    '저장 시 사라진 항목의 필터와 정렬은 초기화합니다.',
  ] },
  { screen: '양식 설정 편집', anchor: '#wh-schema-cancel', title: '설정 변경 보호', now: [
    '변경이 있으면 취소, 탭 이동, 양식 이동 시 확인 창을 띄웁니다.',
  ] },

  /* 변경 이력 */
  { screen: '변경 이력', anchor: '.wh-event', title: '변경 이력', must: [
    '이력은 영구 보존합니다. 수정·삭제 기능을 만들지 않습니다.',
    '내역이나 항목을 숨겨도 관련 이력은 유지합니다.',
  ], now: [
    '기록 대상: 내역 등록, 수정, 줄 추가·삭제, 내역 삭제, 양식 생성, 양식 변경.',
    '작성자는 "관리자 (예시)"로 고정되어 있습니다.',
  ], ask: [
    '작성자는 로그인 사용자, 시각은 서버 시각으로 기록하고, 서버에서도 수정·삭제를 막아 주세요.',
  ] },
];

const root = document.getElementById('workhub-proto');
const storageKey = 'workhub-dev-notes-visible';
let visible = true;
try { visible = localStorage.getItem(storageKey) !== 'false'; } catch {}
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const checkedKey = 'workhub-dev-notes-checked';
const noteKey = note => note.screen + '|' + note.title;
let checked = new Set();
try { checked = new Set(JSON.parse(localStorage.getItem(checkedKey)) || []); } catch {}
const isChecked = note => checked.has(noteKey(note));
const checkBox = note => '<label class="dn-check"><input type="checkbox" data-dn-check="' + esc(noteKey(note)) + '"' + (isChecked(note) ? ' checked' : '') + '>확인했습니다</label>';
function setChecked(key, value) {
  if (value) checked.add(key); else checked.delete(key);
  try { localStorage.setItem(checkedKey, JSON.stringify([...checked])); } catch {}
  pins.forEach((pin, note) => pin.classList.toggle('is-checked', isChecked(note)));
  panel.classList.toggle('is-checked', !!activeNote && isChecked(activeNote));
  document.querySelectorAll('[data-dn-check]').forEach(box => {
    if (box.dataset.dnCheck !== key) return;
    box.checked = value;
    box.closest('.dn-list-note')?.classList.toggle('is-checked', value);
  });
  syncCount();
}
const sections = [['must', '요구사항'], ['now', '현재 동작'], ['ask', '개발 시 필요']];
const noteSection = ([key, label], note) => note[key]?.length ? '<section class="dn-section dn-' + key + '"><h4>' + label + '</h4><ul>' + note[key].map(line => '<li>' + esc(line) + '</li>').join('') + '</ul></section>' : '';
const noteBody = note => noteSection(sections[0], note) + (note.example ? '<section class="dn-section"><h4>예시</h4><pre class="dn-example">' + esc(note.example) + '</pre></section>' : '') + noteSection(sections[1], note) + noteSection(sections[2], note);

const panel = document.createElement('div');
panel.className = 'dn-panel';
panel.setAttribute('popover', 'manual');
panel.setAttribute('role', 'dialog');
let activeNote = null, activePin = null;

function closePanel(returnFocus) {
  if (panel.matches(':popover-open')) panel.hidePopover();
  activePin?.setAttribute('aria-expanded', 'false');
  if (returnFocus && activePin?.isConnected) activePin.focus();
  activeNote = null; activePin = null;
}
function placePanel() {
  if (!activePin) return;
  const rect = activePin.getBoundingClientRect(), width = panel.offsetWidth, height = panel.offsetHeight, gap = 8;
  const fitsBelow = rect.bottom + gap + height <= innerHeight - 8;
  panel.style.left = Math.max(8, Math.min(rect.left, innerWidth - width - 8)) + 'px';
  panel.style.top = Math.max(8, fitsBelow ? rect.bottom + gap : rect.top - gap - height) + 'px';
}
function openPanel(note, pin) {
  if (activeNote === note) { closePanel(true); return; }
  closePanel(false);
  // A modal dialog makes everything outside it inert, so the panel must live inside the dialog.
  (pin.closest('dialog') || root).appendChild(panel);
  panel.setAttribute('aria-label', note.title);
  panel.innerHTML = '<div class="dn-panel-head"><div><small>' + esc(note.screen) + '</small><h3>' + esc(note.title) + '</h3></div><button type="button" class="wh-icon-btn" data-dn-close aria-label="메모 닫기"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>' + noteBody(note) + checkBox(note);
  panel.classList.toggle('is-checked', isChecked(note));
  panel.showPopover();
  activeNote = note; activePin = pin;
  pin.setAttribute('aria-expanded', 'true');
  placePanel();
  panel.querySelector('[data-dn-close]').focus();
}
panel.addEventListener('click', event => { if (event.target.closest('[data-dn-close]')) closePanel(true); });
root.addEventListener('change', event => {
  const box = event.target.closest?.('[data-dn-check]');
  if (box) setChecked(box.dataset.dnCheck, box.checked);
});
document.addEventListener('pointerdown', event => {
  if (activeNote && !panel.contains(event.target) && !event.target.closest('.dn-pin')) closePanel(false);
}, true);
// Esc closes the note first, so it can't also close the form underneath.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeNote) { event.preventDefault(); event.stopPropagation(); closePanel(true); }
}, true);

function layerFor(host) {
  let layer = [...host.children].find(child => child.classList.contains('dn-layer'));
  if (!layer) { layer = document.createElement('div'); layer.className = 'dn-layer'; host.appendChild(layer); }
  return layer;
}
function clippedOut(anchor, x, y) {
  for (let el = anchor.parentElement; el && el !== document.body; el = el.parentElement) {
    if (getComputedStyle(el).overflowX === 'visible' && getComputedStyle(el).overflowY === 'visible') continue;
    const box = el.getBoundingClientRect();
    if (x < box.left - 1 || x > box.right + 1 || y < box.top - 1 || y > box.bottom + 1) return true;
  }
  return false;
}
// Text gets its pin beside the words so nothing is covered; controls and containers get it on the corner.
function pinPoint(anchor) {
  const isTextOnly = !anchor.children.length && anchor.textContent.trim() && !anchor.matches('.wh-btn, .wh-icon-btn');
  if (!isTextOnly) {
    const rect = anchor.getBoundingClientRect();
    return { x: rect.right + 1, y: rect.top - 3 };
  }
  const range = document.createRange();
  range.selectNodeContents(anchor);
  const rect = range.getBoundingClientRect();
  return { x: rect.right + 11, y: rect.top + rect.height / 2 };
}
const pins = new Map();
function update() {
  const inTop = new Set();
  if (visible) notes.forEach(note => {
    const anchor = [...root.querySelectorAll(note.anchor)].find(el => el.getClientRects().length && !el.closest('.dn-panel'));
    if (!anchor) return;
    const host = anchor.closest('dialog') || root, point = pinPoint(anchor);
    const x = Math.min(point.x, innerWidth - 16), y = point.y;
    let pin = pins.get(note);
    if (!pin) {
      pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'dn-pin';
      pin.setAttribute('aria-label', '개발 메모: ' + note.title);
      pin.setAttribute('aria-expanded', 'false');
      pin.setAttribute('aria-haspopup', 'dialog');
      pin.title = note.title;
      pin.innerHTML = '<img src="' + pinSrc + '" alt="" width="30" height="30">';
      pin.classList.toggle('is-checked', isChecked(note));
      pin.addEventListener('click', event => { event.stopPropagation(); openPanel(note, pin); });
      pins.set(note, pin);
    }
    const layer = layerFor(host);
    if (pin.parentElement !== layer) layer.appendChild(pin);
    // Page pins scroll with the page on their own. Dialogs don't scroll the page, so theirs stay fixed.
    const onPage = host === root;
    pin.style.position = onPage ? 'absolute' : 'fixed';
    pin.style.left = x + (onPage ? scrollX : 0) + 'px';
    pin.style.top = y + (onPage ? scrollY : 0) + 'px';
    // Test the anchor itself: a pin may sit slightly outside the box that clips its anchor.
    const box = anchor.getBoundingClientRect();
    pin.hidden = clippedOut(anchor, box.right - 2, box.top + 2);
    inTop.add(note);
  });
  pins.forEach((pin, note) => {
    if (inTop.has(note)) return;
    if (activeNote === note) closePanel(false);
    pin.remove();
    pins.delete(note);
  });
  if (activeNote) placePanel();
}
let updateTimer = null;
function scheduleUpdate() { clearTimeout(updateTimer); updateTimer = setTimeout(update, 16); }
new MutationObserver(records => {
  if (records.every(record => record.target.closest?.('.dn-layer, .dn-panel'))) return;
  scheduleUpdate();
}).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'class'] });
addEventListener('scroll', update, { capture: true, passive: true });
addEventListener('resize', scheduleUpdate);

/* Controls and full list: pins only exist on the open screen, so the list keeps pop-up notes from being missed. */
function openFullList() {
  const screens = [...new Set(notes.map(note => note.screen))];
  const dialog = document.createElement('dialog');
  dialog.className = 'wh-dialog wh-dialog-wide dn-list';
  dialog.setAttribute('aria-label', '전체 개발 메모');
  dialog.innerHTML = '<div class="wh-dialog-head"><h3>전체 개발 메모 ' + notes.length + '개</h3><button type="button" class="wh-icon-btn" data-dn-list-close aria-label="닫기"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div><div class="wh-dialog-body">' + screens.map(screen => '<section class="dn-list-screen"><h3>' + esc(screen) + '</h3>' + notes.filter(note => note.screen === screen).map(note => '<article class="dn-list-note' + (isChecked(note) ? ' is-checked' : '') + '"><h4 class="dn-list-title">' + esc(note.title) + '</h4>' + noteBody(note) + checkBox(note) + '</article>').join('') + '</section>').join('') + '</div>';
  root.appendChild(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('[data-dn-list-close]').onclick = () => { dialog.close(); dialog.remove(); };
  dialog.showModal();
}
const controls = document.createElement('div');
controls.className = 'dn-controls';
controls.innerHTML = '<span>개발 메모 <b data-dn-count></b></span><button type="button" class="wh-btn wh-btn-sm" data-dn-all>전체 보기</button><button type="button" class="wh-btn wh-btn-sm" data-dn-toggle aria-pressed="' + visible + '"></button>';
root.querySelector('.wh-pagehead .wh-chip').before(controls);
function syncCount() {
  const done = notes.filter(isChecked).length;
  controls.querySelector('[data-dn-count]').textContent = '확인 ' + done + ' / ' + notes.length;
}
syncCount();
const toggle = controls.querySelector('[data-dn-toggle]');
function syncToggle() { toggle.textContent = visible ? '숨기기' : '표시'; toggle.setAttribute('aria-pressed', String(visible)); }
syncToggle();
toggle.onclick = () => {
  visible = !visible;
  try { localStorage.setItem(storageKey, String(visible)); } catch {}
  if (!visible) closePanel(false);
  syncToggle(); update();
};
controls.querySelector('[data-dn-all]').onclick = openFullList;
window.workhubDevNotes = { notes };
update();
})();
