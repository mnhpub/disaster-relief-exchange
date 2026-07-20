import { DomainEvent } from '../../domain/value-objects/shared.js';
import { EventBus } from '../../infrastructure/messaging/event-bus.js';
import { EventStoreAdapter } from '../../infrastructure/persistence/event-store.js';
import { ResourceRequest, RequestStatus } from '../../domain/aggregates/resource-request/resource-request.js';

export class OfferMatchedSaga {
  constructor(
    private eventBus: EventBus,
    private eventStore: EventStoreAdapter
  ) {
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // When an offer is reserved, update the matched request's status
    this.eventBus.subscribe('OfferReserved', async (event: DomainEvent) => {
      await this.handleOfferReserved(event);
    });
  }

  private async handleOfferReserved(event: DomainEvent): Promise<void> {
    const offerReservedEvent = event as any;
    
    if (!offerReservedEvent.requestId) {
      return;
    }

    const requestEvents = await this.eventStore.getEvents(
      offerReservedEvent.requestId
    );

    if (requestEvents.length === 0) {
      return;
    }

    const request = new ResourceRequest(
      {} as any,
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
    request.loadFromHistory(requestEvents);

    request.matchOffer(offerReservedEvent.offerId);

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
