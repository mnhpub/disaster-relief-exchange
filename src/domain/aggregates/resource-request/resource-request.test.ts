import { describe, it, expect } from 'bun:test';
import { ResourceRequest, RequestStatus } from './resource-request.js';
import { IncidentId, UserId, RequestId, ResourceType, Location, NeedPriority } from '../../value-objects/shared.js';

describe('ResourceRequest Aggregate', () => {
  it('should create a new resource request', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.WATER,
      100,
      'gallons',
      location,
      NeedPriority.HIGH,
      'Emergency water supply needed'
    );

    expect(request).toBeTruthy();
    expect(request.getStatus()).toBe(RequestStatus.OPEN);
  });

  it('should match an offer', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.FOOD,
      50,
      'portions',
      location,
      NeedPriority.MEDIUM,
      ''
    );

    request.matchOffer('offer-123');

    expect(request.getStatus()).toBe(RequestStatus.MATCHED);
  });

  it('should fulfill a matched request', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.MEDICAL,
      10,
      'kits',
      location,
      NeedPriority.CRITICAL,
      ''
    );

    request.matchOffer('offer-456');
    request.fulfill();

    expect(request.getStatus()).toBe(RequestStatus.FULFILLED);
  });

  it('should not allow fulfilling non-matched request', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.SHELTER,
      5,
      'spaces',
      location,
      NeedPriority.HIGH,
      ''
    );

    expect(() => request.fulfill()).toThrow();
  });

  it('should cancel an open request', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.FUEL,
      50,
      'gallons',
      location,
      NeedPriority.MEDIUM,
      ''
    );

    request.cancel('No longer needed');

    expect(request.getStatus()).toBe(RequestStatus.CANCELLED);
  });

  it('should not allow modifying fulfilled request', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.WATER,
      100,
      'gallons',
      location,
      NeedPriority.HIGH,
      ''
    );

    request.matchOffer('offer-789');
    request.fulfill();

    expect(() => {
      request.update({ quantity: 50 });
    }).toThrow();
  });

  it('should load from event history', () => {
    const incidentId = IncidentId.create();
    const userId = UserId.create();
    const requestId = RequestId.create();
    const location = Location.create(40.7128, -74.006);

    const request = ResourceRequest.create(
      incidentId,
      userId,
      ResourceType.FOOD,
      100,
      'portions',
      location,
      NeedPriority.MEDIUM,
      'Need food supplies'
    );

    const events = request.getUncommittedEvents();

    const restoredRequest = new ResourceRequest(
      requestId,
      incidentId,
      userId,
      ResourceType.FOOD,
      100,
      'portions',
      location,
      NeedPriority.MEDIUM,
      'Need food supplies',
      RequestStatus.OPEN,
      new Date()
    );

    restoredRequest.loadFromHistory(events);

    expect(restoredRequest.getStatus()).toBe(RequestStatus.OPEN);
  });
});
