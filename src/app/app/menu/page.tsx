'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
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
  UtensilsCrossed, FolderPlus
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const fetchData = useCallback(async () => {
    if (!pub) return;

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
  }, [pub, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleAvailability = async (item: MenuItem) => {
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

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId);

    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      fetchData(); // Refresh to update items
    }
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
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Menu</h1>
          <p className="text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} in {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="flex gap-2">
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
                className="bg-amber-600 hover:bg-amber-700 text-white"
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
                fetchData();
              }}
            />
          </Dialog>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading menu...
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-xl border"
        >
          <UtensilsCrossed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-warm-brown mb-2">
            No menu items yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Add your first menu item to get started
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
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
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-warm-brown">{category.name}</h2>
                  <span className="text-sm text-muted-foreground">
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
                  <div className="p-4 text-center text-muted-foreground text-sm">
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
                <h2 className="font-semibold text-warm-brown">Uncategorized</h2>
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
      !item.is_available && 'opacity-50 bg-gray-50'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-warm-brown">{item.name}</span>
          {!item.is_available && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
              Unavailable
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className="font-semibold text-amber-600">
          £{item.price.toFixed(2)}
        </span>
      </div>
      <Switch
        checked={item.is_available}
        onCheckedChange={onToggle}
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
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !name || !price) return;

    setSaving(true);
    try {
      const data = {
        pub_id: pub.id,
        name,
        description: description || null,
        price: parseFloat(price),
        category_id: categoryId || null,
        image_url: imageUrl || null,
      };

      if (item) {
        await supabase.from('menu_items').update(data).eq('id', item.id);
      } else {
        await supabase.from('menu_items').insert(data);
      }

      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item');
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
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (£) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
        <div>
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !name || !price}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {item ? 'Save' : 'Add Item'}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !name) return;

    setSaving(true);
    try {
      if (category) {
        await supabase
          .from('menu_categories')
          .update({ name })
          .eq('id', category.id);
      } else {
        // Get max order
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
      alert('Failed to save category');
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
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {category ? 'Save' : 'Add Category'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
