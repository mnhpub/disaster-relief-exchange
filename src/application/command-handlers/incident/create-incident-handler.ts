import { IncidentId, Location, DomainEvent } from '../../../domain/value-objects/shared.js';
import { Incident } from '../../../domain/aggregates/incident/incident.js';
import { CreateIncident } from '../../../domain/commands/incident/incident-commands.js';
import { EventStoreAdapter } from '../../../infrastructure/persistence/event-store.js';

export class CreateIncidentHandler {
  constructor(private eventStore: EventStoreAdapter) {}

  async execute(command: CreateIncident): Promise<IncidentId> {
    const incident = Incident.create(
      command.title,
      command.description,
      command.location
    );

    const events = incident.getUncommittedEvents();

    for (const event of events) {
      await this.eventStore.append(
        incident.getId().value,
        'Incident',
        event
      );
    }

    incident.markEventsAsCommitted();

    return incident.getId();
  }
}
