import { describe, it, expect } from 'vitest';
import { DemoOrdersState } from '@/lib/demo-data';

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];

const sampleOrderInput = {
  table_id: 't1',
  table_number: 1,
  table_name: 'Window Seat',
  items: [
    { id: 'm1', name: 'Guinness', price: 5.8, quantity: 2 },
    { id: 'm2', name: 'Heineken', price: 5.5, quantity: 1 },
  ],
  total: 17.1,
};

describe('DemoOrdersState', () => {
  describe('getOrders', () => {
    it('returns an empty array when no orders exist', () => {
      expect(DemoOrdersState.getOrders()).toEqual([]);
    });
  });

  describe('addOrder', () => {
    it('creates an order with a 4-digit confirmation code', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      expect(order.confirmation_code).toMatch(/^\d{4}$/);
    });

    it('starts orders in "pending" status', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      expect(order.status).toBe('pending');
    });

    it('persists the order so getOrders returns it', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      const all = DemoOrdersState.getOrders();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(order.id);
    });

    it('stores the line items, total, and table info', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      expect(order.total).toBe(17.1);
      expect(order.tables.number).toBe(1);
      expect(order.tables.name).toBe('Window Seat');
      expect(order.order_items).toHaveLength(2);
      expect(order.order_items[0].name).toBe('Guinness');
      expect(order.order_items[0].quantity).toBe(2);
    });

    it('places newer orders before older ones (newest first)', () => {
      const a = DemoOrdersState.addOrder(sampleOrderInput);
      const b = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_number: 2,
      });
      const all = DemoOrdersState.getOrders();
      expect(all[0].id).toBe(b.id);
      expect(all[1].id).toBe(a.id);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates the status of a single order', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      DemoOrdersState.updateOrderStatus(order.id, 'accepted');
      expect(
        DemoOrdersState.getOrders().find((o) => o.id === order.id)?.status
      ).toBe('accepted');
    });

    it('does not affect other orders', () => {
      const a = DemoOrdersState.addOrder(sampleOrderInput);
      const b = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_number: 2,
      });
      DemoOrdersState.updateOrderStatus(a.id, 'preparing');
      const all = DemoOrdersState.getOrders();
      expect(all.find((o) => o.id === a.id)?.status).toBe('preparing');
      expect(all.find((o) => o.id === b.id)?.status).toBe('pending');
    });

    it('handles the full bar workflow: pending → accepted → preparing → ready → collected', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      const transitions = [
        'accepted',
        'preparing',
        'ready',
        'collected',
      ] as const;
      for (const next of transitions) {
        DemoOrdersState.updateOrderStatus(order.id, next);
        expect(
          DemoOrdersState.getOrders().find((o) => o.id === order.id)?.status
        ).toBe(next);
      }
    });
  });

  describe('subscribe', () => {
    it('fires when a new order is added', async () => {
      await new Promise<void>((resolve) => {
        const unsub = DemoOrdersState.subscribe((orders) => {
          if (orders.length === 1) {
            unsub();
            resolve();
          }
        });
        DemoOrdersState.addOrder(sampleOrderInput);
      });
    });

    it('fires when status is updated', async () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      await new Promise<void>((resolve) => {
        const unsub = DemoOrdersState.subscribe((orders) => {
          const found = orders.find((o) => o.id === order.id);
          if (found?.status === 'preparing') {
            unsub();
            resolve();
          }
        });
        DemoOrdersState.updateOrderStatus(order.id, 'preparing');
      });
    });

    it('stops firing after unsubscribe', () => {
      let calls = 0;
      const unsub = DemoOrdersState.subscribe(() => {
        calls++;
      });
      DemoOrdersState.addOrder(sampleOrderInput);
      expect(calls).toBe(1);
      unsub();
      DemoOrdersState.addOrder(sampleOrderInput);
      expect(calls).toBe(1);
    });

    it('multiple subscribers all receive updates (e.g. dashboard + customer at once)', () => {
      let barCalls = 0;
      let customerCalls = 0;
      const unsubBar = DemoOrdersState.subscribe(() => {
        barCalls++;
      });
      const unsubCustomer = DemoOrdersState.subscribe(() => {
        customerCalls++;
      });
      DemoOrdersState.addOrder(sampleOrderInput);
      expect(barCalls).toBe(1);
      expect(customerCalls).toBe(1);
      unsubBar();
      unsubCustomer();
    });
  });

  describe('integration: customer → bar dashboard wiring (regression for B2)', () => {
    it('customer-placed orders appear as "active" when bar reads', () => {
      // Customer side: place order
      const order = DemoOrdersState.addOrder(sampleOrderInput);

      // Bar side: same logic as src/app/app/page.tsx fetchOrders demo branch
      const active = DemoOrdersState.getOrders().filter((o) =>
        ACTIVE_STATUSES.includes(o.status)
      );

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(order.id);
      expect(active[0].confirmation_code).toBe(order.confirmation_code);
    });

    it('bar marking "collected" removes the order from the active view', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      DemoOrdersState.updateOrderStatus(order.id, 'collected');
      const active = DemoOrdersState.getOrders().filter((o) =>
        ACTIVE_STATUSES.includes(o.status)
      );
      expect(active).toHaveLength(0);
    });

    it('bar-side status update fires customer-side subscription (regression for B11)', async () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);

      // Customer subscribes (mimicking ordering-client.tsx demo branch)
      await new Promise<void>((resolve) => {
        const unsubCustomer = DemoOrdersState.subscribe((all) => {
          const updated = all.find((o) => o.id === order.id);
          if (updated?.status === 'ready') {
            unsubCustomer();
            resolve();
          }
        });

        // Bar progresses through statuses
        DemoOrdersState.updateOrderStatus(order.id, 'accepted');
        DemoOrdersState.updateOrderStatus(order.id, 'preparing');
        DemoOrdersState.updateOrderStatus(order.id, 'ready');
      });
    });
  });

  describe('multiple customers / collisions', () => {
    it('two orders from different tables appear together on the bar dashboard', () => {
      const a = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_id: 't1',
        table_number: 1,
      });
      const b = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_id: 't2',
        table_number: 2,
      });
      const active = DemoOrdersState.getOrders().filter((o) =>
        ACTIVE_STATUSES.includes(o.status)
      );
      expect(active).toHaveLength(2);
      expect(active.map((o) => o.id).sort()).toEqual([a.id, b.id].sort());
    });

    it('two orders from the same table both persist', () => {
      const a = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_id: 't1',
        table_number: 1,
      });
      const b = DemoOrdersState.addOrder({
        ...sampleOrderInput,
        table_id: 't1',
        table_number: 1,
      });
      expect(DemoOrdersState.getOrders()).toHaveLength(2);
      // Orders are independent; same table is fine.
      expect(a.id).not.toBe(b.id);
    });

    it('updating one order does not change another', () => {
      const a = DemoOrdersState.addOrder(sampleOrderInput);
      const b = DemoOrdersState.addOrder(sampleOrderInput);
      DemoOrdersState.updateOrderStatus(a.id, 'cancelled');
      const all = DemoOrdersState.getOrders();
      expect(all.find((o) => o.id === a.id)?.status).toBe('cancelled');
      expect(all.find((o) => o.id === b.id)?.status).toBe('pending');
    });
  });

  describe('confirmation code', () => {
    // Documents a known limitation, not a strict guarantee. 4-digit random codes
    // can collide; uniqueness is not enforced. Worth a real fix before launch.
    it('generates a 4-digit numeric code in [1000, 9999]', () => {
      const order = DemoOrdersState.addOrder(sampleOrderInput);
      const n = parseInt(order.confirmation_code, 10);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    });
  });
});
