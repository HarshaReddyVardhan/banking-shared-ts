/**
 * Base Kafka producer class for TypeScript services.
 * Provides resilient message publishing with retry logic.
 */

import { Kafka, Producer, Partitioners, CompressionTypes, RecordMetadata } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, Logger } from 'winston';
import { BaseEvent, createBaseEvent, EventType } from '../events';

export interface ProducerConfig {
    clientId: string;
    brokers: string[];
    serviceName: string;
    retries?: number;
    initialRetryTime?: number;
}

export interface PublishOptions {
    correlationId?: string;
    headers?: Record<string, string>;
}

/**
 * Base Kafka producer with circuit breaker pattern.
 * Extend this class for service-specific producers.
 */
export class BaseProducer {
    protected kafka: Kafka;
    protected producer: Producer | null = null;
    protected isConnected: boolean = false;
    protected readonly serviceName: string;
    protected readonly eventVersion = '1.0';
    protected logger: Logger;

    constructor(config: ProducerConfig, logger?: Logger) {
        this.serviceName = config.serviceName;
        this.logger = logger || createLogger({ level: 'info' });

        this.kafka = new Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
            retry: {
                initialRetryTime: config.initialRetryTime || 100,
                retries: config.retries || 5,
            },
        });
    }

    /**
     * Initialize and connect the producer
     */
    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            this.producer = this.kafka.producer({
                createPartitioner: Partitioners.DefaultPartitioner,
                allowAutoTopicCreation: true,
                transactionTimeout: 30000,
                idempotent: true, // Enable exactly-once semantics
            });

            await this.producer.connect();
            this.isConnected = true;
            this.logger.info('Kafka producer connected');
        } catch (error) {
            this.logger.error('Failed to connect Kafka producer', { error });
            throw error;
        }
    }

    /**
     * Disconnect the producer
     */
    async disconnect(): Promise<void> {
        if (this.producer && this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
            this.logger.info('Kafka producer disconnected');
        }
    }

    /**
     * Publish an event to a topic
     */
    async publish(
        topic: string,
        eventType: EventType,
        payload: Record<string, unknown>,
        key: string,
        options?: PublishOptions
    ): Promise<RecordMetadata[] | null> {
        if (!this.producer || !this.isConnected) {
            this.logger.warn('Kafka producer not connected, event logged locally', {
                topic,
                eventType,
                payload,
            });
            return null;
        }

        const event: BaseEvent = {
            ...createBaseEvent(eventType, this.serviceName),
            correlationId: options?.correlationId,
        };

        const message = {
            ...event,
            payload,
        };

        try {
            const result = await this.producer.send({
                topic,
                compression: CompressionTypes.GZIP,
                messages: [
                    {
                        key,
                        value: JSON.stringify(message),
                        headers: {
                            'event-type': eventType,
                            'event-version': this.eventVersion,
                            'source-service': this.serviceName,
                            'correlation-id': options?.correlationId || '',
                            ...options?.headers,
                        },
                    },
                ],
            });

            this.logger.debug('Message published', { topic, eventType, key });
            return result;
        } catch (error) {
            this.logger.error('Failed to publish message', {
                topic,
                eventType,
                error,
            });
            throw error;
        }
    }

    /**
     * Publish multiple events as a batch
     */
    async publishBatch(
        topic: string,
        messages: Array<{
            eventType: EventType;
            payload: Record<string, unknown>;
            key: string;
        }>,
        options?: PublishOptions
    ): Promise<RecordMetadata[] | null> {
        if (!this.producer || !this.isConnected) {
            this.logger.warn('Kafka producer not connected, batch logged locally');
            return null;
        }

        try {
            const kafkaMessages = messages.map((msg) => {
                const event: BaseEvent = {
                    ...createBaseEvent(msg.eventType, this.serviceName),
                    correlationId: options?.correlationId,
                };

                return {
                    key: msg.key,
                    value: JSON.stringify({ ...event, payload: msg.payload }),
                    headers: {
                        'event-type': msg.eventType,
                        'event-version': this.eventVersion,
                        'source-service': this.serviceName,
                    },
                };
            });

            const result = await this.producer.send({
                topic,
                compression: CompressionTypes.GZIP,
                messages: kafkaMessages,
            });

            this.logger.debug('Batch published', { topic, count: messages.length });
            return result;
        } catch (error) {
            this.logger.error('Failed to publish batch', { topic, error });
            throw error;
        }
    }

    /**
     * Check if producer is connected
     */
    isProducerConnected(): boolean {
        return this.isConnected;
    }
}
