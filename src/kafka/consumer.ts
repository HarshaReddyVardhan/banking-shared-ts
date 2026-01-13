/**
 * Base Kafka consumer class for TypeScript services.
 * Provides message consumption with proper error handling.
 */

import { Kafka, Consumer, EachMessagePayload, ConsumerConfig } from 'kafkajs';
import { createLogger, Logger } from 'winston';

export interface ConsumerHandlerConfig {
    clientId: string;
    brokers: string[];
    groupId: string;
    topics: string[];
}

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

/**
 * Base Kafka consumer with automatic reconnection and error handling.
 */
export class BaseConsumer {
    protected kafka: Kafka;
    protected consumer: Consumer | null = null;
    protected isConnected: boolean = false;
    protected isRunning: boolean = false;
    protected handler: MessageHandler | null = null;
    protected topics: string[];
    protected logger: Logger;

    constructor(config: ConsumerHandlerConfig, logger?: Logger) {
        this.topics = config.topics;
        this.logger = logger || createLogger({ level: 'info' });

        this.kafka = new Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
            retry: {
                initialRetryTime: 100,
                retries: 10,
            },
        });

        this.consumer = this.kafka.consumer({
            groupId: config.groupId,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
        });
    }

    /**
     * Set the message handler
     */
    setHandler(handler: MessageHandler): void {
        this.handler = handler;
    }

    /**
     * Connect to Kafka
     */
    async connect(): Promise<void> {
        if (!this.consumer) {
            throw new Error('Consumer not initialized');
        }

        try {
            await this.consumer.connect();
            this.isConnected = true;
            this.logger.info('Kafka consumer connected');
        } catch (error) {
            this.logger.error('Failed to connect Kafka consumer', { error });
            throw error;
        }
    }

    /**
     * Start consuming messages
     */
    async start(): Promise<void> {
        if (!this.consumer) {
            throw new Error('Consumer not initialized');
        }

        if (!this.handler) {
            throw new Error('Message handler not set');
        }

        try {
            // Subscribe to topics
            await this.consumer.subscribe({
                topics: this.topics,
                fromBeginning: false,
            });

            // Start consuming
            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    const startTime = Date.now();
                    try {
                        await this.handler!(payload);
                        this.logger.debug('Message processed', {
                            topic: payload.topic,
                            partition: payload.partition,
                            offset: payload.message.offset,
                            processingMs: Date.now() - startTime,
                        });
                    } catch (error) {
                        this.logger.error('Failed to process message', {
                            topic: payload.topic,
                            partition: payload.partition,
                            offset: payload.message.offset,
                            error,
                        });
                        // Re-throw to prevent offset commit
                        throw error;
                    }
                },
            });

            this.isRunning = true;
            this.logger.info('Consumer started', { topics: this.topics });
        } catch (error) {
            this.logger.error('Failed to start consumer', { error });
            throw error;
        }
    }

    /**
     * Stop consuming messages
     */
    async stop(): Promise<void> {
        if (this.consumer) {
            await this.consumer.stop();
            this.isRunning = false;
            this.logger.info('Consumer stopped');
        }
    }

    /**
     * Disconnect from Kafka
     */
    async disconnect(): Promise<void> {
        if (this.consumer && this.isConnected) {
            await this.consumer.disconnect();
            this.isConnected = false;
            this.logger.info('Kafka consumer disconnected');
        }
    }

    /**
     * Pause consumption
     */
    async pause(): Promise<void> {
        if (this.consumer && this.isRunning) {
            this.consumer.pause(this.topics.map((topic) => ({ topic })));
            this.logger.info('Consumer paused');
        }
    }

    /**
     * Resume consumption
     */
    async resume(): Promise<void> {
        if (this.consumer && this.isRunning) {
            this.consumer.resume(this.topics.map((topic) => ({ topic })));
            this.logger.info('Consumer resumed');
        }
    }

    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Check if consumer is running
     */
    isConsumerRunning(): boolean {
        return this.isRunning;
    }
}
