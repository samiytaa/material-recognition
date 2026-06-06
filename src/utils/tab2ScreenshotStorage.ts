const DB_NAME = 'material-recognition-tab2';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';

interface StoredScreenshot {
  rowId: number;
  dataUrl: string;
  updatedAt: number;
}

function openTab2ScreenshotDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'rowId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runScreenshotTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  return openTab2ScreenshotDb().then(db => new Promise<T | void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = handler(store);
    let requestResult: T | undefined;

    if (request) {
      request.onsuccess = () => {
        requestResult = request.result;
      };
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => resolve(request ? requestResult : undefined);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => db.close()));
}

export function saveTab2Screenshot(rowId: number, dataUrl: string): Promise<void> {
  return runScreenshotTransaction('readwrite', store => {
    store.put({ rowId, dataUrl, updatedAt: Date.now() } satisfies StoredScreenshot);
  }).then(() => undefined);
}

export function deleteTab2Screenshot(rowId: number): Promise<void> {
  return runScreenshotTransaction('readwrite', store => {
    store.delete(rowId);
  }).then(() => undefined);
}

export async function loadTab2Screenshots(rowIds: number[]): Promise<Map<number, string>> {
  const entries = await Promise.all(
    rowIds.map(async rowId => {
      const stored = await runScreenshotTransaction<StoredScreenshot | undefined>(
        'readonly',
        store => store.get(rowId)
      );
      return [rowId, stored && 'dataUrl' in stored ? stored.dataUrl : null] as const;
    })
  );

  return new Map(
    entries
      .filter((entry): entry is readonly [number, string] => entry[1] !== null)
      .map(([rowId, dataUrl]) => [rowId, dataUrl])
  );
}

export function clearTab2Screenshots(): Promise<void> {
  return runScreenshotTransaction('readwrite', store => {
    store.clear();
  }).then(() => undefined);
}
