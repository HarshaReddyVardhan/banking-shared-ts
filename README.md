# @banking/shared

Shared TypeScript library for NextGen Banking microservices.

## Installation

```bash
npm install @banking/shared
```

Or link locally for development:

```bash
cd banking-shared-ts
npm link

# In consuming service
npm link @banking/shared
```

## Usage

### Events

```typescript
import { TransactionEvents, FraudEvents, createBaseEvent } from '@banking/shared';

const event = createBaseEvent(TransactionEvents.INITIATED, 'my-service');
```

### Kafka Producer

```typescript
import { BaseProducer, KafkaTopics } from '@banking/shared';

const producer = new BaseProducer({
    clientId: 'my-service',
    brokers: ['localhost:9092'],
    serviceName: 'my-service',
});

await producer.connect();
await producer.publish(KafkaTopics.TRANSACTION_INITIATED, 'TransactionInitiated', payload, userId);
```

### Validators

```typescript
import { transactionSchema, validate } from '@banking/shared';

const result = validate(transactionSchema, requestBody);
if (!result.success) {
    return res.status(400).json({ errors: result.errors });
}
```

### Models

```typescript
import { Transaction, User, TransactionStatus } from '@banking/shared';

const txn: Transaction = {
    id: '...',
    status: TransactionStatus.PENDING,
    // ...
};
```

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```
