import { describe, it, expect, mock } from 'bun:test';
import { IncidentProjection } from './incident-projection.js';
import { IncidentCreated, IncidentOpened } from '../../domain/events/incident/incident-events.js';
import { IncidentId, Location } from '../../domain/value-objects/shared.js';

describe('IncidentProjection', () => {
  it('should handle IncidentCreated event', async () => {
    const mockDb = {
      prepare: mock((sql: string) => ({
        bind: mock(() => ({
          run: mock(async () => ({}))
        }))
      }))
    };

    const projection = new IncidentProjection(mockDb as any);
    const incidentId = IncidentId.create();
    const location = Location.create(40.7128, -74.006);
    const event = new IncidentCreated(
      incidentId,
      'Test Incident',
      'Test Description',
      location,
      new Date()
    );

    await projection.handle(event);

    expect(mockDb.prepare.mock.calls.length).toBeGreaterThan(0);
    const sqlCall = mockDb.prepare.mock.calls[0][0];
    expect(sqlCall).toContain('INSERT');
    expect(sqlCall).toContain('incidents');
  });

  it('should handle IncidentOpened event', async () => {
    const mockDb = {
      prepare: mock((sql: string) => ({
        bind: mock(() => ({
          run: mock(async () => ({}))
        }))
      }))
    };

    const projection = new IncidentProjection(mockDb as any);
    const incidentId = IncidentId.create();
    const event = new IncidentOpened(incidentId, new Date(), 2);

    await projection.handle(event);

    const sqlCall = mockDb.prepare.mock.calls[0][0];
    expect(sqlCall).toContain('UPDATE');
    expect(sqlCall).toContain('incidents');
  });
});
