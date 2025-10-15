// backend/src/common/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly pbkdf2Iterations = 100000;

  private getKey(salt: Buffer): Buffer {
    const masterKey = process.env.ENCRYPTION_KEY || 'change-this-in-production-to-random-32-chars';
    
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.pbkdf2Iterations,
      this.keyLength,
      'sha512'
    );
  }

  encrypt(text: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const key = this.getKey(salt);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: salt:iv:tag:encrypted
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':');
  }

  decrypt(encryptedData: string): string {
    try {
      const [saltHex, ivHex, tagHex, encrypted] = encryptedData.split(':');
      
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const key = this.getKey(salt);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash для webhook secret
  hashWebhookSecret(botToken: string): string {
    return crypto
      .createHash('sha256')
      .update(botToken + process.env.WEBHOOK_SALT || 'webhook-salt')
      .digest('hex')
      .substring(0, 32);
  }
}