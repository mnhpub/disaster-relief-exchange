import { IncidentId } from '../../../domain/value-objects/shared.js';
import { Incident, IncidentStatus } from '../../../domain/aggregates/incident/incident.js';
import { OpenIncident } from '../../../domain/commands/incident/incident-commands.js';
import { EventStoreAdapter } from '../../../infrastructure/persistence/event-store.js';

export class OpenIncidentHandler {
  constructor(private eventStore: EventStoreAdapter) {}

  async execute(command: OpenIncident): Promise<void> {
    const events = await this.eventStore.getEvents(command.incidentId.value);

    if (events.length === 0) {
      throw new Error(`Incident ${command.incidentId.value} not found`);
    }

    const incident = new Incident(
      command.incidentId,
      '',
      '',
      undefined as any,
      IncidentStatus.DRAFT,
      new Date()
    );
    incident.loadFromHistory(events);

    incident.open();

    const uncommittedEvents = incident.getUncommittedEvents();
    for (const event of uncommittedEvents) {
      await this.eventStore.append(
        incident.getId().value,
        'Incident',
        event
      );
    }

    incident.markEventsAsCommitted();
  }
}
