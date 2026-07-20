import { RequestId } from '../../../domain/value-objects/shared.js';
import { ResourceRequest, RequestStatus } from '../../../domain/aggregates/resource-request/resource-request.js';
import { FulfillRequest } from '../../../domain/commands/resource-exchange/request-commands.js';
import { EventStoreAdapter } from '../../../infrastructure/persistence/event-store.js';

export class FulfillRequestHandler {
  constructor(private eventStore: EventStoreAdapter) {}

  async execute(command: FulfillRequest): Promise<void> {
    const events = await this.eventStore.getEvents(command.requestId.value);

    if (events.length === 0) {
      throw new Error(`Request ${command.requestId.value} not found`);
    }

    const request = new ResourceRequest(
      command.requestId,
      {} as any,
      {} as any,
      {} as any,
      0,
      '',
      {} as any,
      {} as any,
      '',
      RequestStatus.OPEN,
      new Date()
    );
    request.loadFromHistory(events);

    request.fulfill();

    const uncommittedEvents = request.getUncommittedEvents();
    for (const event of uncommittedEvents) {
      await this.eventStore.append(
        request.getId().value,
        'ResourceRequest',
        event
      );
    }

    request.markEventsAsCommitted();
  }
}
