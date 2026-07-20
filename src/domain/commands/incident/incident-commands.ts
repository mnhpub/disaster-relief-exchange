import { IncidentId, Location } from '../../value-objects/shared.js';

export class CreateIncident {
  constructor(
    readonly title: string,
    readonly description: string,
    readonly location: Location
  ) {
    if (!title || title.trim().length === 0) {
      throw new Error('Incident title cannot be empty');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Incident description cannot be empty');
    }
  }
}

export class OpenIncident {
  constructor(readonly incidentId: IncidentId) {}
}

export class CloseIncident {
  constructor(
    readonly incidentId: IncidentId,
    readonly reason: string
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Close reason cannot be empty');
    }
  }
}

export class PublishAdvisory {
  constructor(
    readonly incidentId: IncidentId,
    readonly title: string,
    readonly content: string
  ) {
    if (!title || title.trim().length === 0) {
      throw new Error('Advisory title cannot be empty');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Advisory content cannot be empty');
    }
  }
}
