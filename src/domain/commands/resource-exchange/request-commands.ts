import { IncidentId, RequestId, ResourceType, Location, NeedPriority } from '../../value-objects/shared.js';

export class CreateRequest {
  constructor(
    readonly incidentId: IncidentId,
    readonly resourceType: ResourceType,
    readonly quantity: number,
    readonly unit: string,
    readonly location: Location,
    readonly priority: NeedPriority,
    readonly note?: string
  ) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (!unit || unit.trim().length === 0) {
      throw new Error('Unit cannot be empty');
    }
  }
}

export class UpdateRequest {
  constructor(
    readonly requestId: RequestId,
    readonly changes: {
      quantity?: number;
      priority?: NeedPriority;
      note?: string;
      location?: Location;
    }
  ) {
    if (changes.quantity !== undefined && changes.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
}

export class MatchOffer {
  constructor(
    readonly requestId: RequestId,
    readonly offerId: string
  ) {}
}

export class FulfillRequest {
  constructor(readonly requestId: RequestId) {}
}

export class CancelRequest {
  constructor(
    readonly requestId: RequestId,
    readonly reason: string
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason cannot be empty');
    }
  }
}

export class ExpireRequest {
  constructor(readonly requestId: RequestId) {}
}
