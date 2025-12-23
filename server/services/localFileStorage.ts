import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export class LocalFileStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Buffer, originalName: string): Promise<string> {
    const fileId = randomUUID();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    await fs.writeFile(filePath, file);
    
    // Return a URL path that can be served by Express
    return `/uploads/${fileName}`;
  }

  async getFile(fileName: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const localFileStorage = new LocalFileStorage();