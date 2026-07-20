import { v4 as uuidv4 } from 'uuid';

export class IncidentId {
  constructor(readonly value: string) {
    if (!value) throw new Error('IncidentId cannot be empty');
  }

  static create(): IncidentId {
    return new IncidentId(uuidv4());
  }

  equals(other: IncidentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class UserId {
  constructor(readonly value: string) {
    if (!value) throw new Error('UserId cannot be empty');
  }

  static create(): UserId {
    return new UserId(uuidv4());
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class OrganizationId {
  constructor(readonly value: string) {
    if (!value) throw new Error('OrganizationId cannot be empty');
  }

  static create(): OrganizationId {
    return new OrganizationId(uuidv4());
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export enum ResourceType {
  WATER = 'WATER',
  FOOD = 'FOOD',
  CLEANING = 'CLEANING',
  MEDICAL = 'MEDICAL',
  FUEL = 'FUEL',
  POWER = 'POWER',
  SHELTER = 'SHELTER',
  TRANSPORTATION = 'TRANSPORTATION',
  CHILD_CARE = 'CHILD_CARE',
  PET_SUPPLIES = 'PET_SUPPLIES',
  COMMUNICATIONS = 'COMMUNICATIONS',
  TOOLS = 'TOOLS',
  MISCELLANEOUS = 'MISCELLANEOUS'
}

export class Location {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
    readonly geoCell?: string
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  static create(lat: number, lon: number, geoCell?: string): Location {
    return new Location(lat, lon, geoCell);
  }

  equals(other: Location): boolean {
    return (
      this.latitude === other.latitude &&
      this.longitude === other.longitude &&
      this.geoCell === other.geoCell
    );
  }
}

export enum VerificationLevel {
  UNVERIFIED = 0,
  DEVICE_VERIFIED = 1,
  PHONE_VERIFIED = 2,
  EMAIL_VERIFIED = 3,
  QR_VERIFIED = 4,
  ORGANIZATION_VERIFIED = 5
}

export enum ContactMethod {
  NONE = 'NONE',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  IN_PERSON = 'IN_PERSON'
}

export enum NeedPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class RequestId {
  constructor(readonly value: string) {
    if (!value) throw new Error('RequestId cannot be empty');
  }

  static create(): RequestId {
    return new RequestId(uuidv4());
  }

  equals(other: RequestId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class OfferId {
  constructor(readonly value: string) {
    if (!value) throw new Error('OfferId cannot be empty');
  }

  static create(): OfferId {
    return new OfferId(uuidv4());
  }

  equals(other: OfferId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class ShiftId {
  constructor(readonly value: string) {
    if (!value) throw new Error('ShiftId cannot be empty');
  }

  static create(): ShiftId {
    return new ShiftId(uuidv4());
  }

  equals(other: ShiftId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class TrustProfileId {
  constructor(readonly value: string) {
    if (!value) throw new Error('TrustProfileId cannot be empty');
  }

  static create(): TrustProfileId {
    return new TrustProfileId(uuidv4());
  }

  equals(other: TrustProfileId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
}
