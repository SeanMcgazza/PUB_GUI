'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
import { DEMO_CATEGORIES, DemoMenuState, isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types/database';
import { 
  Plus, Pencil, Trash2, GripVertical, Loader2,
  UtensilsCrossed, FolderPlus, RefreshCw
} from 'lucide-react';

export default function MenuPage() {
  const { pub } = usePub();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const fetchData = useCallback(async () => {
    if (!pub) return;

    // Demo mode - use localStorage-synced data
    if (isDemoMode()) {
      setCategories(DEMO_CATEGORIES as unknown as MenuCategory[]);
      setItems(DemoMenuState.getItems() as unknown as MenuItem[]);
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('*')
        .eq('pub_id', pub.id)
        .order('order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('pub_id', pub.id)
        .order('name', { ascending: true }),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data as MenuCategory[]);
    if (itemsRes.data) setItems(itemsRes.data as MenuItem[]);
    setLoading(false);
  }, [pub]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to demo menu updates (for cross-tab sync)
    if (isDemoMode()) {
      const unsubscribe = DemoMenuState.subscribe((updatedItems) => {
        setItems(updatedItems as unknown as MenuItem[]);
      });
      return unsubscribe;
    }
  }, [fetchData]);

  const toggleAvailability = async (item: MenuItem) => {
    // Demo mode - use DemoMenuState for persistence
    if (isDemoMode()) {
      const updated = DemoMenuState.toggleAvailability(item.id);
      setItems(updated as unknown as MenuItem[]);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !i.is_available } : i
        )
      );
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this menu item?')) return;

    // Demo mode - use DemoMenuState
    if (isDemoMode()) {
      const updated = DemoMenuState.deleteItem(itemId);
      setItems(updated as unknown as MenuItem[]);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category? Items will become uncategorized.')) return;

    // Demo mode - update local state only
    if (isDemoMode()) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId);

    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      fetchData();
    }
  };

  const resetToDefaults = () => {
    if (!confirm('Reset menu to default items? This will undo all changes.')) return;
    const updated = DemoMenuState.reset();
    setItems(updated as unknown as MenuItem[]);
  };

  // Group items by category
  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  const uncategorizedItems = items.filter((item) => !item.category_id);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Menu</h1>
            <p className="text-gray-500">
              {items.length} item{items.length !== 1 ? 's' : ''} in {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {isDemoMode() && (
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Menu
            </Button>
          )}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Category
              </Button>
            </DialogTrigger>
            <CategoryDialog
              pub={pub}
              category={editingCategory}
              onClose={() => {
                setShowCategoryDialog(false);
                setEditingCategory(null);
                fetchData();
              }}
            />
          </Dialog>
          <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => setEditingItem(null)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <ItemDialog
              pub={pub}
              categories={categories}
              item={editingItem}
              onClose={() => {
                setShowItemDialog(false);
                setEditingItem(null);
                if (isDemoMode()) {
                  setItems(DemoMenuState.getItems() as unknown as MenuItem[]);
                } else {
                  fetchData();
                }
              }}
            />
          </Dialog>
        </div>
      </motion.div>

      {/* Demo Mode Notice */}
      {isDemoMode() && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-sm">
            <strong>Demo Mode:</strong> Changes sync with customer app via browser storage. 
            Toggle items on/off and refresh the customer page to see changes.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading menu...
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl border"
        >
          <UtensilsCrossed className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No menu items yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first menu item to get started
          </p>
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              setEditingItem(null);
              setShowItemDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {itemsByCategory.map(({ category, items: catItems }) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">{category.name}</h2>
                  <span className="text-sm text-gray-500">
                    ({catItems.length})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryDialog(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {catItems.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleAvailability(item)}
                    onEdit={() => {
                      setEditingItem(item);
                      setShowItemDialog(true);
                    }}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
                {catItems.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No items in this category
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {uncategorizedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900">Uncategorized</h2>
              </div>
              <div className="divide-y">
                {uncategorizedItems.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleAvailability(item)}
                    onEdit={() => {
                      setEditingItem(item);
                      setShowItemDialog(true);
                    }}
                    onDelete={() => deleteItem(item.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4',
      !item.is_available && 'opacity-60 bg-gray-50'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{item.name}</span>
          {!item.is_available && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">
              OFF
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 truncate">
            {item.description}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className="font-bold text-gray-700">
          €{item.price.toFixed(2)}
        </span>
      </div>
      <Switch
        checked={item.is_available}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${item.name} availability`}
      />
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-red-500 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ItemDialog({
  pub,
  categories,
  item,
  onClose,
}: {
  pub: { id: string } | null;
  categories: MenuCategory[];
  item: MenuItem | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !name || !price) return;

    setError('');
    setSaving(true);

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price');
        setSaving(false);
        return;
      }

      // Demo mode - use DemoMenuState
      if (isDemoMode()) {
        if (item) {
          DemoMenuState.updateItem(item.id, {
            name,
            description: description || null,
            price: priceNum,
            category_id: categoryId || null,
          } as never);
        } else {
          DemoMenuState.addItem({
            id: crypto.randomUUID(),
            pub_id: pub.id,
            name,
            description: description || null,
            price: priceNum,
            category_id: categoryId || null,
            is_available: true,
            image_url: null,
          } as never);
        }
        onClose();
        return;
      }

      // Production mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const data = {
        pub_id: pub.id,
        name,
        description: description || null,
        price: priceNum,
        category_id: categoryId || null,
      };

      if (item) {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update(data)
          .eq('id', item.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert({ ...data, is_available: true });
        if (insertError) throw insertError;
      }

      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Guinness"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 568ml pint"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (€) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5.50"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !name || !price}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function CategoryDialog({
  pub,
  category,
  onClose,
}: {
  pub: { id: string } | null;
  category: MenuCategory | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !name) return;

    setError('');
    setSaving(true);

    try {
      if (category) {
        await supabase
          .from('menu_categories')
          .update({ name })
          .eq('id', category.id);
      } else {
        const { data: maxOrder } = await supabase
          .from('menu_categories')
          .select('order')
          .eq('pub_id', pub.id)
          .order('order', { ascending: false })
          .limit(1)
          .single();

        await supabase.from('menu_categories').insert({
          pub_id: pub.id,
          name,
          order: (maxOrder?.order || 0) + 1,
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="catName">Name *</Label>
          <Input
            id="catName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beers, Spirits, Food..."
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !name}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {category ? 'Save' : 'Add Category'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
