import { describe, it, expect, mock } from 'bun:test';
import { CreateIncidentHandler } from './create-incident-handler.js';
import { CreateIncident } from '../../../domain/commands/incident/incident-commands.js';
import { Location } from '../../../domain/value-objects/shared.js';

describe('CreateIncidentHandler', () => {
  it('should create an incident and persist to event store', async () => {
    const mockEventStore = {
      append: mock(async () => {}),
      getEvents: mock(async () => []),
      getAllEventsSince: mock(async () => []),
      getEventsByType: mock(async () => [])
    };

    const handler = new CreateIncidentHandler(mockEventStore);
    const location = Location.create(40.7128, -74.006);
    const command = new CreateIncident(
      'Earthquake',
      'Major earthquake in downtown',
      location
    );

    const incidentId = await handler.execute(command);

    expect(incidentId).toBeTruthy();
    expect(incidentId.value).toBeTruthy();
    expect(mockEventStore.append.mock.calls.length).toBeGreaterThan(0);
  });

  it('should throw error on invalid command', async () => {
    const mockEventStore = {
      append: mock(async () => {}),
      getEvents: mock(async () => []),
      getAllEventsSince: mock(async () => []),
      getEventsByType: mock(async () => [])
    };

    const handler = new CreateIncidentHandler(mockEventStore);
    const location = Location.create(40.7128, -74.006);

    expect(() => {
      new CreateIncident('', '', location);
    }).toThrow();
  });
});
