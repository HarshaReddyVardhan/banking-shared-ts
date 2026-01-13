/**
 * Standardized Kafka event types for banking services.
 * These event types are shared across all TypeScript microservices.
 */

// Transaction event types
export const TransactionEvents = {
    INITIATED: 'TransactionInitiated',
    ANALYZING: 'TransactionAnalyzing',
    APPROVED: 'TransactionApproved',
    REJECTED: 'TransactionRejected',
    COMPLETED: 'TransactionCompleted',
    FAILED: 'TransactionFailed',
    CANCELLED: 'TransactionCancelled',
    WAITING_REVIEW: 'TransactionWaitingReview',
} as const;

// Fraud event types
export const FraudEvents = {
    ANALYSIS_COMPLETE: 'FraudAnalysisComplete',
    SUSPECTED: 'FraudSuspected',
    REVIEW_COMPLETE: 'FraudReviewComplete',
    MANUAL_REVIEW_REQUIRED: 'ManualReviewRequired',
    BLOCKLIST_MATCH: 'BlocklistMatch',
} as const;

// User event types
export const UserEvents = {
    CREATED: 'UserCreated',
    UPDATED: 'UserUpdated',
    LOCKED: 'UserLocked',
    PASSWORD_CHANGED: 'UserPasswordChanged',
} as const;

// Auth/Security event types
export const SecurityEvents = {
    LOGIN_SUCCESS: 'user.login.success',
    LOGIN_FAILED: 'user.login.failed',
    MFA_ENABLED: 'user.mfa.enabled',
    MFA_DISABLED: 'user.mfa.disabled',
    TOKEN_REVOKED: 'security.all_tokens_revoked',
    JWT_KEY_ROTATED: 'jwt.key.rotated',
    SECURITY_ALERT: 'security.anomaly_detected',
    USER_REGISTERED: 'user.registered',
    EMAIL_VERIFIED: 'user.email.verified',
    PASSWORD_RESET_REQUESTED: 'user.password.reset_requested',
    PASSWORD_RESET: 'user.password.reset',
    DEVICE_REGISTERED: 'user.device.registered',
    DEVICE_REVOKED: 'user.device.revoked',
    SESSION_CREATED: 'session.created',
    SESSION_TERMINATED: 'session.terminated',
} as const;

// Notification event types
export const NotificationEvents = {
    SENT: 'NotificationSent',
    FAILED: 'NotificationFailed',
    REQUESTED: 'NotificationRequested',
} as const;

// AML event types
export const AMLEvents = {
    SCREENING_COMPLETE: 'AMLScreeningComplete',
    SAR_FILED: 'SARFiled',
    RISK_PROFILE_UPDATED: 'RiskProfileUpdated',
} as const;

export type TransactionEventType = typeof TransactionEvents[keyof typeof TransactionEvents];
export type FraudEventType = typeof FraudEvents[keyof typeof FraudEvents];
export type UserEventType = typeof UserEvents[keyof typeof UserEvents];
export type SecurityEventType = typeof SecurityEvents[keyof typeof SecurityEvents];
export type NotificationEventType = typeof NotificationEvents[keyof typeof NotificationEvents];
export type AMLEventType = typeof AMLEvents[keyof typeof AMLEvents];

export type EventType =
    | TransactionEventType
    | FraudEventType
    | UserEventType
    | SecurityEventType
    | NotificationEventType
    | AMLEventType;

/**
 * Base event interface for all Kafka events
 */
export interface BaseEvent {
    eventId: string;
    eventType: EventType;
    timestamp: string;
    version: string;
    correlationId?: string;
    causationId?: string;
    source: string;
}

/**
 * Event metadata for tracing and context
 */
export interface EventMetadata {
    sourceIp?: string;
    userAgent?: string;
    deviceId?: string;
    sessionId?: string;
    initiationMethod?: string;
}

/**
 * Transaction initiated event payload
 */
export interface TransactionInitiatedEvent extends BaseEvent {
    transactionId: string;
    userId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string; // Decimal as string for precision
    currency: string;
    transferType: string;
    memo?: string;
    metadata: EventMetadata;
}

/**
 * Fraud analysis complete event payload
 */
export interface FraudAnalysisCompleteEvent extends BaseEvent {
    transactionId: string;
    userId: string;
    analysisId: string;
    riskScore: number;
    decision: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
    reasons?: string[];
    processingMs: number;
}

/**
 * Security event payload
 */
export interface SecurityEvent extends BaseEvent {
    userId?: string;
    payload: Record<string, unknown>;
}

import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new base event with defaults
 */
export function createBaseEvent(eventType: EventType, source: string): BaseEvent {
    return {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date().toISOString(),
        version: '1.0',
        source,
    };
}
