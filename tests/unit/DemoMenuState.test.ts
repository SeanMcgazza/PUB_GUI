import { describe, it, expect } from 'vitest';
import { DemoMenuState } from '@/lib/demo-data';
import type { MenuItem } from '@/types/database';

const sampleItem: MenuItem = {
  id: 'test-item',
  pub_id: 'p1',
  category_id: 'c1',
  name: 'Test Beer',
  description: '500ml',
  price: 5.5,
  image_url: null,
  is_available: true,
  age_restricted: true,
  created_at: new Date().toISOString(),
};

describe('DemoMenuState', () => {
  describe('getItems', () => {
    it('returns the default menu when localStorage is empty', () => {
      const items = DemoMenuState.getItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toMatchObject({
        name: expect.any(String),
        price: expect.any(Number),
      });
    });

    it('returns persisted items when localStorage has data', () => {
      DemoMenuState.saveItems([sampleItem] as never);
      expect(DemoMenuState.getItems()).toEqual([sampleItem]);
    });
  });

  describe('toggleAvailability', () => {
    it('flips is_available from true to false', () => {
      const items = DemoMenuState.getItems();
      const target = items[0];
      expect(target.is_available).toBe(true);
      const after = DemoMenuState.toggleAvailability(target.id);
      expect(after.find((i) => i.id === target.id)?.is_available).toBe(false);
    });

    it('flips back from false to true on second call', () => {
      const items = DemoMenuState.getItems();
      const target = items[0];
      DemoMenuState.toggleAvailability(target.id);
      const after = DemoMenuState.toggleAvailability(target.id);
      expect(after.find((i) => i.id === target.id)?.is_available).toBe(true);
    });
  });

  describe('updateItem', () => {
    it('changes only specified fields', () => {
      const items = DemoMenuState.getItems();
      const target = items[0];
      const updated = DemoMenuState.updateItem(target.id, { price: 999 });
      const after = updated.find((i) => i.id === target.id);
      expect(after?.price).toBe(999);
      expect(after?.name).toBe(target.name);
    });
  });

  describe('addItem', () => {
    it('appends a new item with a generated id', () => {
      const before = DemoMenuState.getItems().length;
      const updated = DemoMenuState.addItem({
        ...sampleItem,
        id: 'will-be-replaced',
        name: 'Brand New Item',
      } as never);
      expect(updated.length).toBe(before + 1);
      const added = updated.find((i) => i.name === 'Brand New Item');
      expect(added).toBeDefined();
      // addItem generates its own id; the supplied id is overwritten.
      expect(added?.id).not.toBe('will-be-replaced');
    });
  });

  describe('deleteItem', () => {
    it('removes the item by id', () => {
      const items = DemoMenuState.getItems();
      const target = items[0];
      const after = DemoMenuState.deleteItem(target.id);
      expect(after.find((i) => i.id === target.id)).toBeUndefined();
      expect(after.length).toBe(items.length - 1);
    });
  });

  describe('reset', () => {
    it('restores the default menu after edits', () => {
      DemoMenuState.deleteItem(DemoMenuState.getItems()[0].id);
      const reset = DemoMenuState.reset();
      expect(reset.length).toBeGreaterThan(0);
      expect(reset).toEqual(DemoMenuState.getItems());
    });
  });

  describe('subscribe', () => {
    it('fires the callback when addItem is called (same-tab custom event)', async () => {
      await new Promise<void>((resolve) => {
        const unsub = DemoMenuState.subscribe((items) => {
          const found = items.find((i) => i.name === 'Subscribed Item');
          if (found) {
            unsub();
            resolve();
          }
        });
        DemoMenuState.addItem({
          ...sampleItem,
          name: 'Subscribed Item',
        } as never);
      });
    });

    it('does not fire the callback after unsubscribing', () => {
      let calls = 0;
      const unsub = DemoMenuState.subscribe(() => {
        calls++;
      });
      DemoMenuState.addItem({ ...sampleItem, name: 'A' } as never);
      expect(calls).toBe(1);
      unsub();
      DemoMenuState.addItem({ ...sampleItem, name: 'B' } as never);
      expect(calls).toBe(1);
    });
  });

  describe('integration: bar → customer menu sync', () => {
    it('item disabled by bar is no longer "available" when customer reads', () => {
      const items = DemoMenuState.getItems();
      const target = items[0];
      DemoMenuState.toggleAvailability(target.id);
      const customerView = DemoMenuState.getItems().filter(
        (i) => i.is_available
      );
      expect(customerView.find((i) => i.id === target.id)).toBeUndefined();
    });
  });
});
