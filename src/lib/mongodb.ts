// MongoDB API client for browser - makes calls to backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Document {
  id: string;
  data(): any;
}

interface QuerySnapshot {
  docs: Document[];
  forEach(callback: (doc: Document) => void): void;
}

// Collection name mapping for API endpoints
const collectionMapping: { [key: string]: string } = {
  'clients': 'clients',
  'recordingDays': 'recording-days',
  'pedEntries': 'ped-entries',
  'scripts': 'scripts',
  'socialMediaFollowers': 'social-media-followers',
  'brainDumpNotes': 'brain-dump-notes'
};

class CollectionReference {
  public collectionName: string;
  
  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }
  
  get name() {
    return this.collectionName;
  }
}

class Query {
  public collection: CollectionReference;
  public constraints: any[];
  
  constructor(collection: CollectionReference, constraints: any[] = []) {
    this.collection = collection;
    this.constraints = constraints;
  }
}

export function collection(_db: any, collectionName: string): CollectionReference {
  return new CollectionReference(collectionName);
}

export function query(
  collection: CollectionReference, 
  ...queryConstraints: any[]
): Query {
  return new Query(collection, queryConstraints);
}

export function orderBy(field: string, direction?: 'asc' | 'desc'): any {
  return { type: 'orderBy', field, direction: direction || 'asc' };
}

export function where(field: string, operator: string, value: any): any {
  return { type: 'where', field, operator, value };
}

export async function getDocs(query: Query): Promise<QuerySnapshot> {
  const collectionName = query.collection.name;
  const apiEndpoint = collectionMapping[collectionName] || collectionName;
  
  console.log(`🔍 Fetching data from MongoDB via API: ${API_BASE_URL}/${apiEndpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    console.log(`✅ Retrieved ${data.length} documents from ${collectionName}:`, data);
    
    // Apply client-side filtering for query constraints (if needed)
    let filteredData = data;
    const constraints = query.constraints || [];
    constraints.forEach((constraint: any) => {
      if (constraint.type === 'where') {
        filteredData = filteredData.filter((item: any) => {
          switch (constraint.operator) {
            case '==':
              return item[constraint.field] === constraint.value;
            case '!=':
              return item[constraint.field] !== constraint.value;
            default:
              return true;
          }
        });
      }
    });
    
    // Convert to documents
    const docs: Document[] = filteredData.map((item: any) => ({
      id: item._id || item.id,
      data: () => ({ ...item, id: item._id || item.id })
    }));
    
    return {
      docs,
      forEach(callback: (doc: Document) => void) {
        docs.forEach(callback);
      }
    };
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    return {
      docs: [],
      forEach(_callback: (doc: Document) => void) {}
    };
  }
}

export async function addDoc(collection: CollectionReference, data: any): Promise<{ id: string }> {
  const collectionName = collection.name;
  const apiEndpoint = collectionMapping[collectionName] || collectionName;
  
  console.log(`📝 Adding document to MongoDB via API: ${API_BASE_URL}/${apiEndpoint}`, data);
  
  try {
    const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Document added to ${collectionName}:`, result);
    return { id: result.id || result._id };
  } catch (error) {
    console.error(`❌ Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDoc(docRef: any, data: any): Promise<void> {
  const collectionName = docRef.collection;
  const docId = docRef.id;
  const apiEndpoint = collectionMapping[collectionName] || collectionName;
  
  try {
    const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ Updated document in ${collectionName}:`, docId);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDoc(docRef: any): Promise<void> {
  const collectionName = docRef.collection;
  const docId = docRef.id;
  const apiEndpoint = collectionMapping[collectionName] || collectionName;
  
  try {
    const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${docId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`✅ Deleted document from ${collectionName}:`, docId);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

export function doc(_db: any, collectionName: string, id: string): any {
  return { collection: collectionName, id };
}

export async function getDoc(docRef: any): Promise<any> {
  const collectionName = docRef.collection;
  const docId = docRef.id;
  const apiEndpoint = collectionMapping[collectionName] || collectionName;
  
  try {
    const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const doc = data.find((item: any) => (item._id || item.id) === docId);
    
    return {
      exists: () => !!doc,
      data: () => doc ? { ...doc, id: doc._id || doc.id } : null
    };
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return {
      exists: () => false,
      data: () => null
    };
  }
}

export async function setDoc(docRef: any, data: any, _options?: any): Promise<void> {
  // For setDoc, we'll use updateDoc if the document exists, otherwise addDoc
  const docExists = await getDoc(docRef);
  if (docExists.exists()) {
    await updateDoc(docRef, data);
  } else {
    const collection = new CollectionReference(docRef.collection);
    await addDoc(collection, { ...data, id: docRef.id });
  }
}

// Mock database object for compatibility
export const db = {};

console.log('� Using real MongoDB API client - connecting to backend server');
