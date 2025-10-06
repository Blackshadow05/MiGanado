import { Client, Databases, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const databases = new Databases(client);
export const storage = new Storage(client);

// IDs de las colecciones
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
export const GANADO_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GANADO_COLLECTION_ID || '';
export const FINCA_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FINCA_COLLECTION_ID || '';
export const APLICACIONES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APLICACIONES_COLLECTION_ID || '';
export const APLICACIONESANIMAL_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_APLICACIONESANIMAL_COLLECTION_ID || '';
export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';