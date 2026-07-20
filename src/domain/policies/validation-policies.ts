export interface GovernanceViolation {
  rule: string;
  message: string;
}

export class GovernancePolicies {
  static validateOnlyOpenIncidentsAcceptRequests(
    incidentStatus: string
  ): GovernanceViolation | null {
    if (incidentStatus !== 'OPEN') {
      return {
        rule: 'OnlyOpenIncidentsAcceptRequests',
        message: 'Only open incidents can accept new requests'
      };
    }
    return null;
  }

  static validateOnlyRequestOwnersCanCancel(
    requestUserId: string,
    cancellationUserId: string
  ): GovernanceViolation | null {
    if (requestUserId !== cancellationUserId) {
      return {
        rule: 'OnlyRequestOwnersCanCancel',
        message: 'Only request owners can cancel their own requests'
      };
    }
    return null;
  }

  static validateFulfilledRequestsAreImmutable(
    requestStatus: string
  ): GovernanceViolation | null {
    if (requestStatus === 'FULFILLED') {
      return {
        rule: 'FulfilledRequestsAreImmutable',
        message: 'Fulfilled requests cannot be modified'
      };
    }
    return null;
  }

  static validateReservedOffersCannotBeReservedTwice(
    offerStatus: string
  ): GovernanceViolation | null {
    if (offerStatus === 'RESERVED') {
      return {
        rule: 'ReservedOffersCannotBeReservedTwice',
        message: 'This offer has already been reserved'
      };
    }
    return null;
  }

  static validateExpiredRequestsCannotBeModified(
    requestStatus: string
  ): GovernanceViolation | null {
    if (requestStatus === 'EXPIRED') {
      return {
        rule: 'ExpiredRequestsCannotBeModified',
        message: 'Expired requests cannot be modified'
      };
    }
    return null;
  }

  static validateOnlyVerifiedOrganizationsPublishAdvisories(
    verificationLevel: number
  ): GovernanceViolation | null {
    if (verificationLevel < 5) {
      return {
        rule: 'OnlyVerifiedOrganizationsPublishAdvisories',
        message: 'Only verified organizations can publish advisories'
      };
    }
    return null;
  }
}
