import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Lazy initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId from configuration
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || "(default)");

// Helper to fetch all documents in a collection
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
}

// Helper to save or update a single document in a collection
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error saving document ${docId} in ${collectionName}:`, error);
    throw error;
  }
}

// Helper to delete a single document
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${docId} in ${collectionName}:`, error);
    throw error;
  }
}

// Seed helper to populate empty collections
export async function seedCollectionIfEmpty<T>(collectionName: string, defaultData: T[]): Promise<T[]> {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty && defaultData.length > 0) {
      console.log(`Seeding collection ${collectionName} with ${defaultData.length} items...`);
      const batch = writeBatch(db);
      for (const item of defaultData) {
        // We use string representation of id as the document path
        const docRef = doc(db, collectionName, String((item as any).id));
        batch.set(docRef, item as any);
      }
      await batch.commit();
      return defaultData;
    }
    
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as T);
    });
    return items;
  } catch (error) {
    console.error(`Error seeding or fetching collection ${collectionName}:`, error);
    // Fallback to defaultData in case of error
    return defaultData;
  }
}

// Helper to fetch the global configuration
export async function fetchGlobalConfig(defaultScolarite: number, defaultAnnees: string[]) {
  try {
    const docRef = doc(db, "global_config", "school_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { scolariteAnnuelle: number; anneesScolaires: string[] };
    } else {
      const initialConfig = { scolariteAnnuelle: defaultScolarite, anneesScolaires: defaultAnnees };
      await setDoc(docRef, initialConfig);
      return initialConfig;
    }
  } catch (error) {
    console.error("Error fetching global config:", error);
    return { scolariteAnnuelle: defaultScolarite, anneesScolaires: defaultAnnees };
  }
}

// Helper to save global configuration
export async function saveGlobalConfig(scolariteAnnuelle: number, anneesScolaires: string[]) {
  try {
    const docRef = doc(db, "global_config", "school_config");
    await setDoc(docRef, { scolariteAnnuelle, anneesScolaires });
  } catch (error) {
    console.error("Error saving global config:", error);
  }
}

// Automatic comparison and sync helper for React state to Firestore
export async function syncCollectionToFirestore<T extends { id: string | number }>(
  collectionName: string,
  currentList: T[],
  prevListRef: { current: T[] | null }
): Promise<void> {
  // If we haven't loaded yet, don't write anything!
  if (prevListRef.current === null) return;

  const prevList = prevListRef.current;
  
  // Find added or updated items
  const toUpsert = currentList.filter(curr => {
    const prev = prevList.find(p => p.id === curr.id);
    if (!prev) return true; // Added
    return JSON.stringify(prev) !== JSON.stringify(curr); // Updated
  });

  // Find deleted items
  const toDelete = prevList.filter(prev => !currentList.some(curr => curr.id === prev.id));

  if (toUpsert.length === 0 && toDelete.length === 0) {
    return;
  }

  console.log(`[Firestore Sync] Syncing ${collectionName}: upserting ${toUpsert.length}, deleting ${toDelete.length}`);
  
  const batch = writeBatch(db);
  
  toUpsert.forEach(item => {
    const docRef = doc(db, collectionName, String(item.id));
    batch.set(docRef, item, { merge: true });
  });

  toDelete.forEach(item => {
    const docRef = doc(db, collectionName, String(item.id));
    batch.delete(docRef);
  });

  try {
    await batch.commit();
    // Update the ref to match the new list
    prevListRef.current = [...currentList];
  } catch (error) {
    console.error(`[Firestore Sync] Error committing batch for ${collectionName}:`, error);
  }
}

