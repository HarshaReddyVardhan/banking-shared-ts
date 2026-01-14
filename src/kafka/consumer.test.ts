import { BaseConsumer, ConsumerHandlerConfig } from './consumer';
import { Kafka, Consumer } from 'kafkajs';

jest.mock('kafkajs');

describe('BaseConsumer', () => {
    let consumer: BaseConsumer;
    let mockKafkaConsumer: jest.Mocked<Consumer>;

    const config: ConsumerHandlerConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        groupId: 'test-group',
        topics: ['test-topic'],
    };

    beforeEach(() => {
        mockKafkaConsumer = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            subscribe: jest.fn(),
            run: jest.fn(),
            stop: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            on: jest.fn(),
            events: {},
        } as unknown as jest.Mocked<Consumer>;

        (Kafka as jest.Mock).mockImplementation(() => ({
            consumer: jest.fn().mockReturnValue(mockKafkaConsumer),
        }));

        consumer = new BaseConsumer(config);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should connect to kafka', async () => {
        await consumer.connect();
        expect(mockKafkaConsumer.connect).toHaveBeenCalled();
        expect(consumer.isConsumerConnected()).toBe(true);
    });

    it('should disconnect from kafka', async () => {
        await consumer.connect();
        await consumer.disconnect();
        expect(mockKafkaConsumer.disconnect).toHaveBeenCalled();
        expect(consumer.isConsumerConnected()).toBe(false);
    });

    it('should start consuming messages', async () => {
        await consumer.connect();
        const handler = jest.fn();
        consumer.setHandler(handler);

        await consumer.start();
        expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
            topics: ['test-topic'],
            fromBeginning: false,
        });
        expect(mockKafkaConsumer.run).toHaveBeenCalled();
        expect(consumer.isConsumerRunning()).toBe(true);
    });

    it('should throw if handler is not set before start', async () => {
        await consumer.connect();
        await expect(consumer.start()).rejects.toThrow('Message handler not set');
    });

    it('should process messages using the handler', async () => {
        await consumer.connect();
        const handler = jest.fn().mockResolvedValue(undefined);
        consumer.setHandler(handler);

        // Manually trigger the eachMessage callback passed to run
        mockKafkaConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
            await eachMessage({
                topic: 'test-topic',
                partition: 0,
                message: { offset: '0', value: Buffer.from('test') },
            });
        });

        await consumer.start();
        expect(handler).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
        await consumer.connect();
        const handler = jest.fn().mockRejectedValue(new Error('Processing failed'));
        consumer.setHandler(handler);

        mockKafkaConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
            try {
                await eachMessage({
                    topic: 'test-topic',
                    partition: 0,
                    message: { offset: '0', value: Buffer.from('test') },
                });
            } catch (error) {
                // Expected error
            }
        });

        await consumer.start();
        expect(handler).toHaveBeenCalled();
    });

    it('should stop consuming', async () => {
        await consumer.connect();
        consumer.setHandler(jest.fn());
        await consumer.start();

        await consumer.stop();
        expect(mockKafkaConsumer.stop).toHaveBeenCalled();
        expect(consumer.isConsumerRunning()).toBe(false);
    });
});
