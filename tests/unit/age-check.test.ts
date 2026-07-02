import { describe, it, expect } from 'vitest';

// Mirrors the rule used in the Stripe webhook: an order needs a staff ID check
// at handoff iff any line item is age-restricted. Kept as a tiny pure helper so
// the decision is unit-tested independently of Stripe.
type Line = { ageRestricted?: boolean };
const idCheckStatus = (items: Line[]) =>
  items.some((i) => i.ageRestricted) ? 'pending' : 'not_required';

describe('idCheckStatus', () => {
  it('is not_required when nothing is age-restricted', () => {
    expect(idCheckStatus([{ ageRestricted: false }, {}])).toBe('not_required');
  });

  it('is pending when any item is age-restricted', () => {
    expect(idCheckStatus([{ ageRestricted: false }, { ageRestricted: true }])).toBe(
      'pending'
    );
  });

  it('is not_required for an empty order', () => {
    expect(idCheckStatus([])).toBe('not_required');
  });
});
