/**
 * Standardized Kafka topic configuration for banking services.
 */

export const KafkaTopics = {
    // Transaction topics
    TRANSACTION_INITIATED: 'banking.transactions.initiated',
    TRANSACTION_APPROVED: 'banking.transactions.approved',
    TRANSACTION_REJECTED: 'banking.transactions.rejected',
    TRANSACTION_COMPLETED: 'banking.transactions.completed',

    // Fraud topics
    FRAUD_ANALYSIS: 'banking.fraud.analysis',
    FRAUD_SUSPECTED: 'banking.fraud.suspected',
    MANUAL_REVIEW: 'banking.fraud.manual-review',

    // User topics
    USER_EVENTS: 'banking.users.events',

    // Auth/Security topics
    SECURITY_EVENTS: 'banking.security.events',

    // Notification topics
    NOTIFICATIONS: 'banking.notifications',

    // AML topics
    AML_SCREENING: 'banking.aml.screening',
    SAR_FILING: 'banking.aml.sar-filing',

    // Audit topics
    AUDIT_LOG: 'banking.audit.log',
} as const;

export type KafkaTopic = typeof KafkaTopics[keyof typeof KafkaTopics];
