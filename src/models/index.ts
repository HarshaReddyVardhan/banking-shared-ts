/**
 * Shared domain models for banking services.
 */

// Transaction status values
export const TransactionStatus = {
    PENDING: 'PENDING',
    ANALYZING: 'ANALYZING',
    WAITING_REVIEW: 'WAITING_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
} as const;

export type TransactionStatusType = typeof TransactionStatus[keyof typeof TransactionStatus];

// Fraud decision values
export const FraudDecision = {
    APPROVED: 'APPROVED',
    SUSPICIOUS: 'SUSPICIOUS',
    REJECTED: 'REJECTED',
} as const;

export type FraudDecisionType = typeof FraudDecision[keyof typeof FraudDecision];

// Transfer type values
export const TransferType = {
    INTERNAL: 'INTERNAL',
    EXTERNAL: 'EXTERNAL',
    WIRE: 'WIRE',
    ACH: 'ACH',
} as const;

export type TransferTypeValue = typeof TransferType[keyof typeof TransferType];

// Initiation method values
export const InitiationMethod = {
    WEB: 'WEB',
    MOBILE: 'MOBILE',
    API: 'API',
    BRANCH: 'BRANCH',
} as const;

export type InitiationMethodValue = typeof InitiationMethod[keyof typeof InitiationMethod];

// Supported currencies
export const Currency = {
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    JPY: 'JPY',
    CAD: 'CAD',
    AUD: 'AUD',
} as const;

export type CurrencyType = typeof Currency[keyof typeof Currency];

/**
 * Check if a currency is supported
 */
export function isValidCurrency(code: string): code is CurrencyType {
    return Object.values(Currency).includes(code as CurrencyType);
}

/**
 * Transaction model (for cross-service communication)
 */
export interface Transaction {
    id: string;
    userId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string; // Decimal as string for precision
    currency: CurrencyType;
    status: TransactionStatusType;
    transferType: TransferTypeValue;
    initiationMethod: InitiationMethodValue;
    reference: string;
    memo?: string;
    fraudScore?: number;
    fraudDecision?: FraudDecisionType;
    sourceIp?: string;
    deviceId?: string;
    sessionId?: string;
    userAgent?: string;
    initiatedAt: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * User model (for cross-service communication)
 */
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
    riskScore: number;
    isVerified: boolean;
    isMfaEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Account model (for cross-service communication)
 */
export interface Account {
    id: string;
    userId: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    currency: CurrencyType;
    balance: string; // Decimal as string
    availableBalance: string;
    status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
}

/**
 * Fraud analysis result
 */
export interface FraudAnalysisResult {
    transactionId: string;
    userId: string;
    analysisId: string;
    riskScore: number;
    decision: FraudDecisionType;
    reasons: string[];
    processingTimeMs: number;
    modelVersion: string;
    analyzedAt: string;
}

/**
 * Manual review request
 */
export interface ManualReviewRequest {
    transactionId: string;
    userId: string;
    amount: string;
    currency: CurrencyType;
    riskScore: number;
    reasons: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requestedAt: string;
}
