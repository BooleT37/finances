import Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';

import type { CurrentPlan, DueSubscription } from './fillFromSubscriptions';
import {
  areAllSubscriptionsApplied,
  fillPlanFromSubscriptions,
  hasAnySubscriptionAlreadyApplied,
} from './fillFromSubscriptions';

function lineItem(
  id: number,
  unitPrice: string,
  quantity = '1',
  comment = '',
  subscriptionId: number | null = null,
): ForecastLineItem {
  return {
    id,
    unitPrice,
    quantity: new Decimal(quantity),
    comment,
    subscriptionId,
  };
}

function due(
  subscriptionId: number,
  cost: string,
  comment = `Подписка — ${subscriptionId}`,
): DueSubscription {
  return { subscriptionId, cost: new Decimal(cost), comment };
}

function plan(lineItems: ForecastLineItem[], sum = '0'): CurrentPlan {
  return { lineItems, sum: new Decimal(sum) };
}

describe('fillPlanFromSubscriptions', () => {
  describe('a cell with nothing in it', () => {
    it('writes one line per subscription', () => {
      const { rows, total } = fillPlanFromSubscriptions(plan([]), [
        due(1, '48.95', 'Подписка — Интернет'),
      ]);
      expect(rows).toEqual([
        {
          unitPrice: '48.95',
          quantity: '1',
          comment: 'Подписка — Интернет',
          subscriptionId: 1,
        },
      ]);
      expect(total.toString()).toBe('48.95');
    });

    it('keeps each subscription on its own line rather than adding them up', () => {
      const { rows, total } = fillPlanFromSubscriptions(plan([]), [
        due(1, '10'),
        due(2, '15'),
      ]);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.subscriptionId)).toEqual([1, 2]);
      expect(total.toString()).toBe('25');
    });
  });

  describe('a cell holding a typed number', () => {
    it('moves the number into a line of its own and adds to it', () => {
      const { rows, total } = fillPlanFromSubscriptions(plan([], '200'), [
        due(1, '48.95'),
      ]);
      expect(rows).toEqual([
        { unitPrice: '200', quantity: '1', comment: '', subscriptionId: null },
        {
          unitPrice: '48.95',
          quantity: '1',
          comment: 'Подписка — 1',
          subscriptionId: 1,
        },
      ]);
      expect(total.toString()).toBe('248.95');
    });

    it('skips a zero, which would only add an empty line', () => {
      const { rows } = fillPlanFromSubscriptions(plan([], '0'), [due(1, '10')]);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.subscriptionId).toBe(1);
    });
  });

  describe('a cell that already has a plan', () => {
    it('appends to it and leaves the existing lines alone', () => {
      const { rows, total } = fillPlanFromSubscriptions(
        plan([lineItem(1, '12+8', '3', 'Проездной')], '60'),
        [due(5, '10')],
      );
      expect(rows).toEqual([
        {
          unitPrice: '12+8',
          quantity: '3',
          comment: 'Проездной',
          subscriptionId: null,
        },
        {
          unitPrice: '10',
          quantity: '1',
          comment: 'Подписка — 5',
          subscriptionId: 5,
        },
      ]);
      expect(total.toString()).toBe('70');
    });

    it('never moves its sum in, since the plan is where that sum came from', () => {
      const { rows } = fillPlanFromSubscriptions(
        plan([lineItem(1, '60')], '60'),
        [due(5, '10')],
      );
      expect(rows).toHaveLength(2);
      expect(rows.filter((r) => r.comment === '')).toHaveLength(1);
    });
  });

  describe('filling a second time', () => {
    it('updates the price of a line it wrote before instead of adding another', () => {
      const { rows, total } = fillPlanFromSubscriptions(
        plan([lineItem(1, '48.95', '1', 'Подписка — Интернет', 7)], '48.95'),
        [due(7, '52.00', 'Подписка — Интернет')],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.unitPrice).toBe('52');
      expect(total.toString()).toBe('52');
    });

    it('leaves a quantity and comment edited by hand as they are', () => {
      const { rows } = fillPlanFromSubscriptions(
        plan([lineItem(1, '10', '2', 'Оплатили дважды', 7)], '20'),
        [due(7, '12')],
      );
      expect(rows[0]).toEqual({
        unitPrice: '12',
        quantity: '2',
        comment: 'Оплатили дважды',
        subscriptionId: 7,
      });
    });

    it('updates the ones it knows and appends the ones it does not', () => {
      const { rows } = fillPlanFromSubscriptions(
        plan([lineItem(1, '10', '1', 'Подписка — A', 7)], '10'),
        [due(7, '11'), due(8, '20', 'Подписка — B')],
      );
      expect(rows).toEqual([
        {
          unitPrice: '11',
          quantity: '1',
          comment: 'Подписка — A',
          subscriptionId: 7,
        },
        {
          unitPrice: '20',
          quantity: '1',
          comment: 'Подписка — B',
          subscriptionId: 8,
        },
      ]);
    });

    it('leaves a hand-written line untouched while updating a subscription one', () => {
      const { rows } = fillPlanFromSubscriptions(
        plan([
          lineItem(1, '100', '1', 'Аренда'),
          lineItem(2, '10', '1', '', 7),
        ]),
        [due(7, '11')],
      );
      expect(rows[0]!.unitPrice).toBe('100');
      expect(rows[1]!.unitPrice).toBe('11');
    });
  });

  it('changes nothing when nothing is due', () => {
    const { rows, total } = fillPlanFromSubscriptions(
      plan([lineItem(1, '12+8', '3', 'Проездной')], '60'),
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.unitPrice).toBe('12+8');
    expect(total.toString()).toBe('60');
  });
});

describe('areAllSubscriptionsApplied', () => {
  it('is true once every due subscription has a line', () => {
    const current = plan([
      lineItem(1, '10', '1', '', 7),
      lineItem(2, '20', '1', '', 8),
    ]);
    expect(
      areAllSubscriptionsApplied(current, [due(7, '10'), due(8, '20')]),
    ).toBe(true);
  });

  it('is false while any of them is missing', () => {
    const current = plan([lineItem(1, '10', '1', '', 7)]);
    expect(
      areAllSubscriptionsApplied(current, [due(7, '10'), due(8, '20')]),
    ).toBe(false);
  });

  it('is false for a plan with no subscription lines at all', () => {
    expect(
      areAllSubscriptionsApplied(plan([lineItem(1, '10')]), [due(7, '10')]),
    ).toBe(false);
  });

  it('is false when nothing is due, so an empty badge never looks applied', () => {
    expect(areAllSubscriptionsApplied(plan([]), [])).toBe(false);
  });
});

describe('hasAnySubscriptionAlreadyApplied', () => {
  it('is false when nothing is applied yet', () => {
    expect(hasAnySubscriptionAlreadyApplied(plan([]), [due(7, '10')])).toBe(
      false,
    );
  });

  it('is true once at least one due subscription already has a line', () => {
    const current = plan([lineItem(1, '10', '1', '', 7)]);
    expect(
      hasAnySubscriptionAlreadyApplied(current, [due(7, '10'), due(8, '20')]),
    ).toBe(true);
  });

  it('is true when every due subscription already has a line', () => {
    const current = plan([
      lineItem(1, '10', '1', '', 7),
      lineItem(2, '20', '1', '', 8),
    ]);
    expect(
      hasAnySubscriptionAlreadyApplied(current, [due(7, '10'), due(8, '20')]),
    ).toBe(true);
  });

  it('is false for a hand-written line that happens to share no subscription', () => {
    expect(
      hasAnySubscriptionAlreadyApplied(plan([lineItem(1, '10')]), [
        due(7, '10'),
      ]),
    ).toBe(false);
  });
});
