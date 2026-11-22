// Progress photos live only on this device (IndexedDB) — never synced.
const DB = 'lockin-photos'
const STORE = 'p'
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db()
  return new Promise((res, rej) => {
    const q = fn(d.transaction(STORE, mode).objectStore(STORE))
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
}
export const putPhoto = (key: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, key))
export const getPhoto = (key: string) => tx<Blob | undefined>('readonly', (s) => s.get(key))
export const delPhoto = (key: string) => tx('readwrite', (s) => s.delete(key))
export const photoKeys = () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys()).then((k) => k.map(String))

/** downscale to ≤1280px JPEG so dozens of photos stay small */
export async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.82))
}
