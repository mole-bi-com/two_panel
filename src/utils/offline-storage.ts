export async function saveTranslationToIndexedDB(translationId: string, chunkId: number, text: string) {
  const db = await openDB('translations', 1, {
    upgrade(db) {
      db.createObjectStore('chunks', { keyPath: ['translationId', 'chunkId'] });
    },
  });

  await db.put('chunks', {
    translationId,
    chunkId,
    text,
    timestamp: Date.now(),
  });
}

export async function syncOfflineTranslations() {
  const db = await openDB('translations', 1);
  const offlineChunks = await db.getAll('chunks');
  
  for (const chunk of offlineChunks) {
    try {
      await saveTranslation(chunk.translationId, chunk.chunkId, chunk.text);
      await db.delete('chunks', [chunk.translationId, chunk.chunkId]);
    } catch (error) {
      console.error('Sync failed for chunk:', chunk, error);
    }
  }
} 