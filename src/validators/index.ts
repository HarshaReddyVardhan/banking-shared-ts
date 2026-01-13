/**
 * Input validators for banking operations.
 */

import Joi from 'joi';

/**
 * Maximum transfer amount in any currency
 */
export const MAX_TRANSFER_AMOUNT = 1000000;

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

/**
 * Transaction amount validation schema
 */
export const amountSchema = Joi.number()
    .positive()
    .max(MAX_TRANSFER_AMOUNT)
    .precision(2)
    .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be greater than zero',
        'number.max': `Amount exceeds maximum limit of ${MAX_TRANSFER_AMOUNT}`,
    });

/**
 * Currency validation schema
 */
export const currencySchema = Joi.string()
    .uppercase()
    .valid(...SUPPORTED_CURRENCIES)
    .messages({
        'any.only': `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
    });

/**
 * Account number validation schema (8-12 digits)
 */
export const accountNumberSchema = Joi.string()
    .pattern(/^\d{8,12}$/)
    .messages({
        'string.pattern.base': 'Account number must be between 8 and 12 digits',
    });

/**
 * Routing number validation schema (9 digits with checksum)
 */
export const routingNumberSchema = Joi.string()
    .pattern(/^\d{9}$/)
    .custom((value: string, helpers: Joi.CustomHelpers<string>) => {
        const digits = value.split('').map(Number);
        const checksum = (
            3 * (digits[0] + digits[3] + digits[6]) +
            7 * (digits[1] + digits[4] + digits[7]) +
            (digits[2] + digits[5] + digits[8])
        ) % 10;

        if (checksum !== 0) {
            return helpers.error('string.checksum');
        }
        return value;
    })
    .messages({
        'string.pattern.base': 'Routing number must be exactly 9 digits',
        'string.checksum': 'Invalid routing number checksum',
    });

/**
 * Email validation schema
 */
export const emailSchema = Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(254)
    .messages({
        'string.email': 'Invalid email format',
    });

/**
 * Password validation schema (banking-grade security)
 */
export const passwordSchema = Joi.string()
    .min(12)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/\d/, 'digit')
    .pattern(/[!@#$%^&*(),.?":{}|<>]/, 'special')
    .messages({
        'string.min': 'Password must be at least 12 characters',
        'string.max': 'Password must be at most 128 characters',
        'string.pattern.name': 'Password must contain at least one {#name} character',
    });

/**
 * UUID validation schema
 */
export const uuidSchema = Joi.string()
    .uuid({ version: 'uuidv4' })
    .messages({
        'string.guid': 'Invalid UUID format',
    });

/**
 * Transaction validation schema
 */
export const transactionSchema = Joi.object({
    fromAccountId: uuidSchema.required(),
    toAccountId: uuidSchema.required(),
    amount: amountSchema.required(),
    currency: currencySchema.required(),
    transferType: Joi.string().valid('INTERNAL', 'EXTERNAL', 'WIRE', 'ACH').required(),
    memo: Joi.string().max(500).optional(),
});

/**
 * User registration validation schema
 */
export const userRegistrationSchema = Joi.object({
    email: emailSchema.required(),
    password: passwordSchema.required(),
    firstName: Joi.string().min(1).max(50).trim().required(),
    lastName: Joi.string().min(1).max(50).trim().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
});

/**
 * Sanitize input to remove dangerous characters
 */
export function sanitizeInput(input: string): string {
    // Remove null bytes and control characters
    return input
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
}

/**
 * Validate and return result
 */
export function validate<T>(
    schema: Joi.Schema,
    value: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.validate(value, { abortEarly: false });

    if (result.error) {
        return {
            success: false,
            errors: result.error.details.map((d: Joi.ValidationErrorItem) => d.message),
        };
    }

    return { success: true, data: result.value as T };
}
