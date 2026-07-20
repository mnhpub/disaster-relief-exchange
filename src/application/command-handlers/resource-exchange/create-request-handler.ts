import { IncidentId, UserId, ResourceType, Location, NeedPriority, RequestId } from '../../../domain/value-objects/shared.js';
import { ResourceRequest } from '../../../domain/aggregates/resource-request/resource-request.js';
import { CreateRequest } from '../../../domain/commands/resource-exchange/request-commands.js';
import { EventStoreAdapter } from '../../../infrastructure/persistence/event-store.js';
import { GovernancePolicies } from '../../../domain/policies/validation-policies.js';

export class CreateRequestHandler {
  constructor(private eventStore: EventStoreAdapter) {}

  async execute(command: CreateRequest): Promise<RequestId> {
    // Validate governance: only open incidents accept requests
    // In a real implementation, we'd fetch the incident from the event store
    // For MVP, we'll assume the incident is open

    const request = ResourceRequest.create(
      command.incidentId,
      {} as UserId, // Will be filled from auth context
      command.resourceType,
      command.quantity,
      command.unit,
      command.location,
      command.priority,
      command.note || ''
    );

    const events = request.getUncommittedEvents();

    for (const event of events) {
      await this.eventStore.append(
        request.getId().value,
        'ResourceRequest',
        event
      );
    }

    request.markEventsAsCommitted();

    return request.getId();
  }
}
