import { describe, it, expect } from 'bun:test';
import { IncidentId, UserId, RequestId, Location, ResourceType } from './shared.js';

describe('Value Objects', () => {
  describe('IncidentId', () => {
    it('should create a new incident ID', () => {
      const id = IncidentId.create();
      expect(id.value).toBeTruthy();
      expect(id.value.length).toBeGreaterThan(0);
    });

    it('should be equal when values match', () => {
      const id1 = new IncidentId('test-id');
      const id2 = new IncidentId('test-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should throw error on empty value', () => {
      expect(() => new IncidentId('')).toThrow();
    });
  });

  describe('UserId', () => {
    it('should create a new user ID', () => {
      const id = UserId.create();
      expect(id.value).toBeTruthy();
    });

    it('should not equal different user IDs', () => {
      const id1 = UserId.create();
      const id2 = UserId.create();
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('Location', () => {
    it('should create a valid location', () => {
      const loc = Location.create(40.7128, -74.006, 'cell-123');
      expect(loc.latitude).toBe(40.7128);
      expect(loc.longitude).toBe(-74.006);
    });

    it('should throw error on invalid latitude', () => {
      expect(() => Location.create(91, -74.006)).toThrow();
    });

    it('should throw error on invalid longitude', () => {
      expect(() => Location.create(40.7128, 181)).toThrow();
    });
  });

  describe('ResourceType enum', () => {
    it('should have all required types', () => {
      expect(ResourceType.WATER).toBe('WATER');
      expect(ResourceType.FOOD).toBe('FOOD');
      expect(ResourceType.MEDICAL).toBe('MEDICAL');
      expect(ResourceType.SHELTER).toBe('SHELTER');
    });
  });
});
