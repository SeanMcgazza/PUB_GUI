'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
import { DEMO_TABLES, isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/database';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, Pencil, Trash2, QrCode, Download, Printer,
  Loader2, LayoutGrid
} from 'lucide-react';

export default function TablesPage() {
  const { pub } = usePub();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const fetchTables = useCallback(async () => {
    if (!pub) return;

    // Demo mode - seed from mock data on first load only; preserve any
    // tables the user added in this session via TableDialog.
    if (isDemoMode()) {
      setTables((prev) =>
        prev.length === 0 ? (DEMO_TABLES as unknown as Table[]) : prev
      );
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('pub_id', pub.id)
      .order('number', { ascending: true });

    if (!error && data) {
      setTables(data);
    }
    setLoading(false);
  }, [pub]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const deleteTable = async (tableId: string) => {
    if (!confirm('Delete this table? This cannot be undone.')) return;

    // Demo mode - update local state only
    if (isDemoMode()) {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);

    if (!error) {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    }
  };

  const getOrderUrl = (table: Table) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/order/${pub?.slug}/${table.qr_token}`;
  };

  const downloadQR = (table: Table) => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 480;
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 50, 50, 300, 300);
        
        // Draw text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pub?.name || 'BarTab', canvas.width / 2, 400);
        ctx.font = '20px sans-serif';
        ctx.fillText(`Table ${table.number}`, canvas.width / 2, 440);
        if (table.name) {
          ctx.font = '16px sans-serif';
          ctx.fillText(table.name, canvas.width / 2, 465);
        }

        // Download
        const link = document.createElement('a');
        link.download = `table-${table.number}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = (table: Table) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const url = getOrderUrl(table);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table ${table.number} QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
              border: 2px solid #d4a574;
              border-radius: 20px;
            }
            h1 { margin: 0 0 10px; color: #5c4934; }
            h2 { margin: 0 0 30px; color: #888; font-weight: normal; }
            p { margin: 20px 0 0; color: #666; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${pub?.name || 'BarTab'}</h1>
            <h2>Table ${table.number}${table.name ? ` - ${table.name}` : ''}</h2>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" />
            <p>Scan to order</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tables</h1>
          <p className="text-muted-foreground">
            {tables.length} table{tables.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => setEditingTable(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <TableDialog
            pub={pub}
            table={editingTable}
            existingNumbers={tables.map((t) => t.number)}
            onSaved={(saved, wasEditing) => {
              if (wasEditing) {
                setTables((prev) =>
                  prev.map((t) => (t.id === saved.id ? saved : t))
                );
              } else {
                setTables((prev) => [...prev, saved]);
              }
            }}
            onClose={() => {
              setShowDialog(false);
              setEditingTable(null);
              if (!isDemoMode()) fetchTables();
            }}
          />
        </Dialog>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading tables...
        </div>
      ) : tables.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-card rounded-xl border"
        >
          <LayoutGrid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No tables yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Add tables and generate QR codes for customers to scan
          </p>
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              setEditingTable(null);
              setShowDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Table
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl border p-4"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Table {table.number}
                  </h3>
                  {table.name && (
                    <p className="text-sm text-muted-foreground">{table.name}</p>
                  )}
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    table.status === 'available' && 'bg-green-100 text-green-700',
                    table.status === 'occupied' && 'bg-[color:var(--theme-surface-elevated)] text-muted-foreground',
                    table.status === 'reserved' && 'bg-blue-100 text-blue-700'
                  )}
                >
                  {table.status}
                </span>
              </div>

              {/* Mini QR Preview */}
              <div
                className="bg-[color:var(--theme-surface-card-hover)]/40 rounded-lg p-4 mb-4 cursor-pointer hover:bg-[color:var(--theme-surface-elevated)] transition-colors"
                onClick={() => {
                  setSelectedTable(table);
                  setShowQrDialog(true);
                }}
              >
                <div className="flex items-center justify-center">
                  <QRCodeSVG
                    id={`qr-${table.id}`}
                    value={getOrderUrl(table)}
                    size={120}
                    level="M"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Click to view full size
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => downloadQR(table)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => printQR(table)}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  aria-label={`Edit table ${table.number}`}
                  onClick={() => {
                    setEditingTable(table);
                    setShowDialog(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-red-500 hover:text-red-600"
                  aria-label={`Delete table ${table.number}`}
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Code Full View Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Table {selectedTable?.number}
              {selectedTable?.name && ` - ${selectedTable.name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="text-center">
              <div className="bg-card p-6 rounded-xl inline-block">
                <QRCodeSVG
                  value={getOrderUrl(selectedTable)}
                  size={250}
                  level="M"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 break-all">
                {getOrderUrl(selectedTable)}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={() => downloadQR(selectedTable)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => printQR(selectedTable)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableDialog({
  pub,
  table,
  existingNumbers,
  onSaved,
  onClose,
}: {
  pub: { id: string } | null;
  table: Table | null;
  existingNumbers: number[];
  onSaved?: (saved: Table, wasEditing: boolean) => void;
  onClose: () => void;
}) {
  const [number, setNumber] = useState(table?.number?.toString() || '');
  const [name, setName] = useState(table?.name || '');
  const [saving, setSaving] = useState(false);

  // Sync form state when the `table` prop changes (edit-after-edit scenarios)
  // and auto-suggest the next number for new tables.
  useEffect(() => {
    if (table) {
      setNumber(table.number.toString());
      setName(table.name || '');
      return;
    }
    if (existingNumbers.length > 0) {
      const maxNum = Math.max(...existingNumbers);
      setNumber((maxNum + 1).toString());
    } else {
      setNumber('1');
    }
    setName('');
  }, [table, existingNumbers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !number) return;

    const tableNumber = parseInt(number);

    // Check for duplicate number (except when editing same table)
    if (existingNumbers.includes(tableNumber) && table?.number !== tableNumber) {
      alert(`Table ${tableNumber} already exists`);
      return;
    }

    setSaving(true);
    try {
      const qr_token = table?.qr_token || crypto.randomUUID();

      // Demo mode: skip Supabase, return the saved table to the parent so
      // it can update its local list. Demo additions are session-only.
      if (isDemoMode()) {
        const saved: Table = {
          id: table?.id || crypto.randomUUID(),
          pub_id: pub.id,
          number: tableNumber,
          name: name || null,
          qr_token,
          status: table?.status || 'available',
          created_at: table?.created_at || new Date().toISOString(),
        };
        onSaved?.(saved, !!table);
        onClose();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const data = {
        pub_id: pub.id,
        number: tableNumber,
        name: name || null,
        qr_token,
      };

      if (table) {
        await supabase.from('tables').update(data).eq('id', table.id);
      } else {
        await supabase.from('tables').insert(data);
      }

      onClose();
    } catch (err) {
      console.error('Error saving table:', err);
      alert('Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{table ? 'Edit Table' : 'Add Table'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="number">Table Number *</Label>
          <Input
            id="number"
            type="number"
            min="1"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="tableName">Name (optional)</Label>
          <Input
            id="tableName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Window Booth, Patio Table..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !number}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {table ? 'Save' : 'Add Table'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
