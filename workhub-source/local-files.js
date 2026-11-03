// Browser-local file references. No server requests or invented absolute paths.
window.workhubFiles = (() => {
  let database;
  function connect() {
    if (!database) database = new Promise((resolve,reject) => {
      const request = indexedDB.open('workhub-local-files-v1',1);
      request.onupgradeneeded = () => request.result.createObjectStore('files',{keyPath:'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('파일 저장소를 열 수 없습니다. 다른 프로토타입 창을 닫고 다시 시도해 주세요.'));
    }).catch(error => { database = null; throw error; });
    return database;
  }
  async function transaction(mode,operation) {
    const db = await connect();
    return new Promise((resolve,reject) => {
      const tx = db.transaction('files',mode);
      const request = operation(tx.objectStore('files'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error || request.error);
      tx.onabort = () => reject(tx.error || new Error('파일 정보를 저장하지 못했습니다.'));
    });
  }
  function parse(value) {
    try { const metadata=JSON.parse(value); return metadata?.fileId && metadata?.name ? metadata : null; }
    catch { return null; }
  }
  async function remember(file,handle) {
    const id = crypto.randomUUID();
    await transaction('readwrite',store=>store.put(handle?{id,handle}:{id,file}));
    return JSON.stringify({fileId:id,name:file.name,mode:handle?'reference':'local-copy'});
  }
  async function read(value) {
    const metadata = parse(value);
    if(!metadata) throw new Error('연결된 파일이 없습니다. 파일을 선택해 주세요.');
    const entry = await transaction('readonly',store=>store.get(metadata.fileId));
    if(!entry) throw new Error('이 브라우저에 파일 연결 정보가 없습니다. 파일을 다시 선택해 주세요.');
    if(entry.handle) {
      const permission = await entry.handle.queryPermission({mode:'read'});
      if(permission!=='granted' && await entry.handle.requestPermission({mode:'read'})!=='granted')
        throw new Error('파일을 열려면 읽기 권한이 필요합니다.');
      try { return await entry.handle.getFile(); }
      catch { throw new Error('파일이 이동되거나 삭제되었습니다. 파일을 다시 선택해 주세요.'); }
    }
    return entry.file;
  }
  async function open(value) {
    const target = window.open('about:blank','_blank');
    if(!target) throw new Error('파일을 열 수 있도록 이 페이지의 팝업을 허용해 주세요.');
    target.opener = null;
    try {
      const file = await read(value);
      const previewable = /^(image\/(png|jpeg|gif|webp|bmp)|application\/pdf|text\/plain)$/.test(file.type);
      const url = URL.createObjectURL(file);
      if(previewable) target.location.replace(url);
      else {
        const link = document.createElement('a');
        link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();target.close();
      }
      setTimeout(()=>URL.revokeObjectURL(url),120000);
      return previewable?'파일을 열었습니다.':'브라우저 미리보기를 지원하지 않는 파일은 다운로드로 열 수 있습니다.';
    } catch(error) { target.close();throw error; }
  }
  return {parse,remember,read,open};
})();
