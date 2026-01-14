import { BaseProducer, ProducerConfig } from './producer';
import { Kafka, Producer } from 'kafkajs';
import { EventType, UserEvents } from '../events';

jest.mock('kafkajs', () => ({
    Kafka: jest.fn(),
    Partitioners: {
        DefaultPartitioner: jest.fn(),
    },
    CompressionTypes: {
        GZIP: 1,
    }
}));
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('BaseProducer', () => {
    let producer: BaseProducer;
    let mockKafkaProducer: jest.Mocked<Producer>;

    const config: ProducerConfig = {
        clientId: 'test-client',
        brokers: ['localhost:9092'],
        serviceName: 'test-service',
    };

    beforeEach(() => {
        mockKafkaProducer = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            send: jest.fn().mockResolvedValue([{ topicName: 'test-topic', partition: 0, errorCode: 0, offset: '0' }]),
            on: jest.fn(),
            events: {},
        } as unknown as jest.Mocked<Producer>;

        (Kafka as jest.Mock).mockImplementation(() => ({
            producer: jest.fn().mockReturnValue(mockKafkaProducer),
        }));

        producer = new BaseProducer(config);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should connect to kafka', async () => {
        await producer.connect();
        expect(mockKafkaProducer.connect).toHaveBeenCalled();
        expect(producer.isProducerConnected()).toBe(true);
    });

    it('should disconnect from kafka', async () => {
        await producer.connect();
        await producer.disconnect();
        expect(mockKafkaProducer.disconnect).toHaveBeenCalled();
        expect(producer.isProducerConnected()).toBe(false);
    });

    it('should publish a message', async () => {
        await producer.connect();
        const result = await producer.publish(
            'test-topic',
            UserEvents.CREATED,
            { id: '123' },
            'user-123'
        );

        expect(mockKafkaProducer.send).toHaveBeenCalledWith(expect.objectContaining({
            topic: 'test-topic',
            messages: expect.arrayContaining([
                expect.objectContaining({
                    key: 'user-123',
                    value: expect.stringContaining(`"eventType":"${UserEvents.CREATED}"`),
                })
            ])
        }));
        expect(result).toBeDefined();
    });

    it('should return null if not connected when publishing', async () => {
        const result = await producer.publish(
            'test-topic',
            UserEvents.CREATED,
            { id: '123' },
            'user-123'
        );
        expect(result).toBeNull();
        expect(mockKafkaProducer.send).not.toHaveBeenCalled();
    });

    it('should publish a batch of messages', async () => {
        await producer.connect();
        const result = await producer.publishBatch(
            'test-topic',
            [
                { eventType: UserEvents.CREATED, payload: { id: '1' }, key: '1' },
                { eventType: UserEvents.UPDATED, payload: { id: '2' }, key: '2' },
            ]
        );

        expect(mockKafkaProducer.send).toHaveBeenCalledWith(expect.objectContaining({
            topic: 'test-topic',
            messages: expect.arrayContaining([
                expect.objectContaining({ key: '1' }),
                expect.objectContaining({ key: '2' }),
            ])
        }));
        expect(result).toBeDefined();
    });

    it('should handle publish errors', async () => {
        await producer.connect();
        mockKafkaProducer.send.mockRejectedValue(new Error('Kafka error'));

        await expect(producer.publish(
            'test-topic',
            UserEvents.CREATED,
            { id: '123' },
            'user-123'
        )).rejects.toThrow('Kafka error');
    });
});
