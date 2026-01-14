import {
    amountSchema,
    currencySchema,
    accountNumberSchema,
    routingNumberSchema,
    emailSchema,
    passwordSchema,
    uuidSchema,
    transactionSchema,
    userRegistrationSchema,
    sanitizeInput,
    validate,
} from './index';

describe('Validators', () => {
    describe('amountSchema', () => {
        it('should validate valid amounts', () => {
            const { success } = validate(amountSchema, 100);
            expect(success).toBe(true);
        });

        it('should reject negative amounts', () => {
            const { success } = validate(amountSchema, -50);
            expect(success).toBe(false);
        });

        it('should reject zero', () => {
            const { success } = validate(amountSchema, 0);
            expect(success).toBe(false); // positive() excludes 0
        });

        it('should reject amounts exceeding max limit', () => {
            const { success } = validate(amountSchema, 1000001);
            expect(success).toBe(false);
        });
    });

    describe('currencySchema', () => {
        it('should validate supported currencies', () => {
            const { success } = validate(currencySchema, 'USD');
            expect(success).toBe(true);
        });

        it('should reject unsupported currencies', () => {
            const { success } = validate(currencySchema, 'INR');
            expect(success).toBe(false);
        });
    });

    describe('accountNumberSchema', () => {
        it('should validate 8-12 digits', () => {
            expect(validate(accountNumberSchema, '12345678').success).toBe(true);
            expect(validate(accountNumberSchema, '123456789012').success).toBe(true);
        });

        it('should reject invalid lengths', () => {
            expect(validate(accountNumberSchema, '123').success).toBe(false);
            expect(validate(accountNumberSchema, '1234567890123').success).toBe(false);
        });

        it('should reject non-digits', () => {
            expect(validate(accountNumberSchema, '1234abcd').success).toBe(false);
        });
    });

    describe('routingNumberSchema', () => {
        it('should validate valid routing number with checksum', () => {
            // US Routing number example: 011000138 (Federal Reserve Bank of Boston)
            // 3(0+0+1) + 7(1+0+3) + (1+0+8) = 3(1) + 7(4) + 9 = 3 + 28 + 9 = 40. 40 % 10 == 0.
            expect(validate(routingNumberSchema, '011000138').success).toBe(true);
        });

        it('should reject invalid checksum', () => {
            expect(validate(routingNumberSchema, '011000139').success).toBe(false);
        });

        it('should reject invalid length', () => {
            expect(validate(routingNumberSchema, '123').success).toBe(false);
        });
    });

    describe('emailSchema', () => {
        it('should validate valid emails', () => {
            expect(validate(emailSchema, 'test@example.com').success).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validate(emailSchema, 'invalid-email').success).toBe(false);
        });
    });

    describe('passwordSchema', () => {
        it('should validate strong passwords', () => {
            expect(validate(passwordSchema, 'StrongP@ssw0rd!').success).toBe(true);
        });

        it('should reject weak passwords', () => {
            expect(validate(passwordSchema, 'weak').success).toBe(false); // too short
            expect(validate(passwordSchema, 'NoSpecialChar1').success).toBe(false);
        });
    });

    describe('uuidSchema', () => {
        it('should validate valid UUID v4', () => {
            expect(validate(uuidSchema, '550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            expect(validate(uuidSchema, 'not-a-uuid').success).toBe(false);
        });
    });

    describe('sanitizeInput', () => {
        it('should remove null bytes and control characters', () => {
            const dirty = 'Hello\0\u0000\u001FWorld';
            const clean = sanitizeInput(dirty);
            expect(clean).toBe('HelloWorld');
        });

        it('should trim whitespace', () => {
            expect(sanitizeInput('  test  ')).toBe('test');
        });
    });

    describe('validate helper', () => {
        it('should return data on success', () => {
            const result = validate(amountSchema, 100);
            if (result.success) {
                expect(result.data).toBe(100);
            } else {
                fail('Should be successful');
            }
        });

        it('should return errors on failure', () => {
            const result = validate(amountSchema, -100);
            if (!result.success) {
                expect(result.errors.length).toBeGreaterThan(0);
            } else {
                fail('Should be failure');
            }
        });
    });
});
