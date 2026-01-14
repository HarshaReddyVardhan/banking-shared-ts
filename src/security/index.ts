/**
 * Security utilities for hashing and encryption.
 * implementation_plan.md: [NEW] [src/security/index.ts]
 */

import argon2 from 'argon2';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Hashing algorithm configuration (Argon2id)
 */
const HASH_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
};

/**
 * Hash a password using Argon2id
 * @param password The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, HASH_OPTIONS);
}

/**
 * Verify a password against a hash
 * @param hash The stored hash
 * @param password The plain text password
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch (err) {
        return false;
    }
}

/**
 * AES-256-GCM Encryption
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Encrypt text using AES-256-GCM
 * @param text The text to encrypt
 * @param key The 32-byte hex key
 * @returns The encrypted string (iv:authTag:encryptedText)
 */
export async function encrypt(text: string, key: string): Promise<string> {
    if (Buffer.from(key, 'hex').length !== KEY_LENGTH) {
        throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-GCM
 * @param ciphertext The encrypted string (iv:authTag:encryptedText)
 * @param key The 32-byte hex key
 * @returns The decrypted text
 */
export async function decrypt(ciphertext: string, key: string): Promise<string> {
    if (Buffer.from(key, 'hex').length !== KEY_LENGTH) {
        throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:authTag:encryptedText');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
