import { hashPassword, verifyPassword, encrypt, decrypt } from './index';

describe('Security', () => {
    describe('Password Hashing', () => {
        it('should hash a password and verify it successfully', async () => {
            const password = 'mySecretPassword123!';
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);

            const isValid = await verifyPassword(hash, password);
            expect(isValid).toBe(true);
        });

        it('should return false for incorrect password verification', async () => {
            const password = 'passwordA';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(hash, 'passwordB');
            expect(isValid).toBe(false);
        });

        it('should return false for malformed hash', async () => {
            const isValid = await verifyPassword('invalid-hash', 'password');
            expect(isValid).toBe(false);
        });
    });

    describe('AES-256-GCM Encryption', () => {
        // 32-byte hex key for testing
        const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const TEXT = 'Sensitive Data';

        it('should encrypt and decrypt correctly', async () => {
            const encrypted = await encrypt(TEXT, TEST_KEY);
            expect(encrypted).not.toBe(TEXT);
            expect(encrypted).toContain(':'); // Should have iv:tag:content

            const decrypted = await decrypt(encrypted, TEST_KEY);
            expect(decrypted).toBe(TEXT);
        });

        it('should fail with invalid key length', async () => {
            await expect(encrypt(TEXT, 'short-key')).rejects.toThrow('Invalid key length');
            await expect(decrypt('some-data', 'short-key')).rejects.toThrow('Invalid key length');
        });

        it('should fail to decrypt tampered data', async () => {
            const encrypted = await encrypt(TEXT, TEST_KEY);
            // Tamper with the encrypted part (last part after second colon)
            const parts = encrypted.split(':');
            parts[2] = parts[2].replace(/[0-9a-f]/, (c) => (c === 'a' ? 'b' : 'a'));
            const tampered = parts.join(':');

            await expect(decrypt(tampered, TEST_KEY)).rejects.toThrow();
        });

        it('should fail to decrypt with wrong key', async () => {
            const encrypted = await encrypt(TEXT, TEST_KEY);
            const WRONG_KEY = '1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
            await expect(decrypt(encrypted, WRONG_KEY)).rejects.toThrow();
        });

        it('should reject invalid ciphertext format', async () => {
            await expect(decrypt('invalidformat', TEST_KEY)).rejects.toThrow('Invalid ciphertext format');
        });
    });
});
