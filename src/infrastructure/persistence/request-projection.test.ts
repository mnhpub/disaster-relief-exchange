import { describe, it, expect, mock } from 'bun:test';
import { RequestProjection } from './request-projection.js';
import { RequestCreated, RequestMatched, RequestFulfilled } from '../../domain/events/resource-exchange/request-events.js';
import { IncidentId, RequestId, UserId, ResourceType, Location, NeedPriority } from '../../domain/value-objects/shared.js';

describe('RequestProjection', () => {
  it('should handle RequestCreated event', async () => {
    const mockDb = {
      prepare: mock((sql: string) => ({
        bind: mock(() => ({
          run: mock(async () => ({})),
          first: mock(async () => ({ total_requests: 1 }))
        }))
      }))
    };

    const projection = new RequestProjection(mockDb as any);
    const requestId = RequestId.create();
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const event = new RequestCreated(
      requestId,
      incidentId,
      userId,
      ResourceType.WATER,
      100,
      'gallons',
      location,
      NeedPriority.HIGH,
      'Emergency water needed',
      new Date()
    );

    await projection.handle(event);

    expect(mockDb.prepare.mock.calls.length).toBeGreaterThanOrEqual(1);
    const sqlCall = mockDb.prepare.mock.calls[0][0];
    expect(sqlCall).toContain('INSERT');
    expect(sqlCall).toContain('resource_requests');
  });

  it('should handle RequestMatched event', async () => {
    const mockDb = {
      prepare: mock((sql: string) => ({
        bind: mock(() => ({
          run: mock(async () => ({}))
        }))
      }))
    };

    const projection = new RequestProjection(mockDb as any);
    const requestId = RequestId.create();
    const event = new RequestMatched(
      requestId,
      'offer-123',
      new Date(),
      2
    );

    await projection.handle(event);

    const sqlCall = mockDb.prepare.mock.calls[0][0];
    expect(sqlCall).toContain('UPDATE');
    expect(sqlCall).toContain('resource_requests');
  });

  it('should handle RequestFulfilled event', async () => {
    const mockDb = {
      prepare: mock((sql: string) => ({
        bind: mock(() => ({
          run: mock(async () => ({}))
        }))
      }))
    };

    const projection = new RequestProjection(mockDb as any);
    const requestId = RequestId.create();
    const event = new RequestFulfilled(
      requestId,
      new Date(),
      3
    );

    await projection.handle(event);

    const sqlCall = mockDb.prepare.mock.calls[0][0];
    expect(sqlCall).toContain('UPDATE');
    expect(sqlCall).toContain('resource_requests');
  });
});
