import { localFileStorage } from "./localFileStorage";

// Environment detection
const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.REPLIT_DOMAINS;

export interface StorageProvider {
  uploadFile(file: Buffer, fileName: string): Promise<string>;
  getFileUrl(fileName: string): string;
  deleteFile(fileName: string): Promise<boolean>;
}

class LocalStorageProvider implements StorageProvider {
  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    return await localFileStorage.saveFile(file, fileName);
  }

  getFileUrl(fileName: string): string {
    return `/uploads/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    return await localFileStorage.deleteFile(fileName);
  }
}

class CloudStorageProvider implements StorageProvider {
  async uploadFile(file: Buffer, fileName: string): Promise<string> {
    // This would integrate with Replit's Object Storage
    throw new Error("Cloud storage not implemented - use Replit's Object Storage service");
  }

  getFileUrl(fileName: string): string {
    return fileName; // Replit Object Storage provides full URLs
  }

  async deleteFile(fileName: string): Promise<boolean> {
    // This would integrate with Replit's Object Storage
    throw new Error("Cloud storage not implemented - use Replit's Object Storage service");
  }
}

// Export the appropriate provider based on environment
export const storageProvider: StorageProvider = isLocalDevelopment 
  ? new LocalStorageProvider()
  : new CloudStorageProvider();

export { isLocalDevelopment };