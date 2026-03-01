export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: string;
}

export type AttachmentMeta = Omit<Attachment, 'blob'>;

const DB_NAME = 'kanban-attachments';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('taskId', 'taskId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addAttachment(
  taskId: string,
  file: File,
): Promise<AttachmentMeta> {
  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch (err) {
    throw new Error(`Failed to open attachment database: ${err}`);
  }
  const id = crypto.randomUUID();
  const attachment: Attachment = {
    id,
    taskId,
    name: file.name,
    type: file.type,
    size: file.size,
    blob: file,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(attachment);
    tx.oncomplete = () => {
      const meta: AttachmentMeta = {
        id: attachment.id,
        taskId: attachment.taskId,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        createdAt: attachment.createdAt,
      };
      resolve(meta);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAttachmentsByTask(taskId: string): Promise<AttachmentMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('taskId');
    const request = index.getAll(taskId);
    request.onsuccess = () => {
      const results: AttachmentMeta[] = request.result.map(
        (a: Attachment): AttachmentMeta => ({
          id: a.id, taskId: a.taskId, name: a.name,
          type: a.type, size: a.size, createdAt: a.createdAt,
        }),
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      const record = request.result as Attachment | undefined;
      resolve(record?.blob ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAttachmentsByTask(taskId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('taskId');
    const request = index.getAllKeys(taskId);
    request.onsuccess = () => {
      for (const key of request.result) {
        store.delete(key);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
