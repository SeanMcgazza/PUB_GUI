'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { ServiceCard } from '@/components/cards/service-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Euro, Clock } from 'lucide-react';
import { Service } from '@/types';

const SERVICE_COLORS = [
  { name: 'Gold', value: '#D4A574' },
  { name: 'Lavender', value: '#B8A4C9' },
  { name: 'Sage', value: '#7DB87D' },
  { name: 'Soft Gold', value: '#E5C07B' },
  { name: 'Rose', value: '#D98B8B' },
];

export default function ServicesPage() {
  const { business, services, categories, addService, updateService, deleteService, toggleServiceActive } = useStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    categoryId: '',
    color: '#D4A574',
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      categoryId: activeCategory,
      color: '#D4A574',
    });
    setEditingService(null);
  };
  
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      categoryId: service.categoryId,
      color: service.color || '#D4A574',
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.categoryId) return;
    
    if (editingService) {
      updateService(editingService.id, {
        name: formData.name,
        description: formData.description || undefined,
        duration: formData.duration,
        price: formData.price,
        categoryId: formData.categoryId,
        color: formData.color,
      });
    } else {
      addService({
        businessId: business.id,
        name: formData.name,
        description: formData.description || undefined,
        duration: formData.duration,
        price: formData.price,
        categoryId: formData.categoryId,
        color: formData.color,
        isActive: true,
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };
  
  const categoryServices = services.filter(s => s.categoryId === activeCategory);
  const totalServices = services.length;
  const activeServicesCount = services.filter(s => s.isActive).length;
  
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Services</h1>
          <p className="text-muted-foreground">
            {activeServicesCount} active of {totalServices} services
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold-dark text-white w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ladies' Cut & Blow Dry"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min={5}
                    step={5}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={5}
                  />
                </div>
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {SERVICE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-warm-brown scale-110' 
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="bg-gold hover:bg-gold-dark text-white"
                  disabled={!formData.name || !formData.categoryId}
                >
                  {editingService ? 'Save Changes' : 'Add Service'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
      
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-gold" />
            <p className="text-2xl font-bold text-warm-brown">{totalServices}</p>
            <p className="text-xs text-muted-foreground">Total Services</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-lavender" />
            <p className="text-2xl font-bold text-warm-brown">
              {Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Duration (mins)</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <Euro className="w-6 h-6 mx-auto mb-2 text-sage" />
            <p className="text-2xl font-bold text-warm-brown">
              €{Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Price</p>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-muted w-full flex overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="flex-1 min-w-[100px]"
            >
              {cat.name}
              <span className="ml-1 text-xs text-muted-foreground">
                ({services.filter(s => s.categoryId === cat.id).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            {services.filter(s => s.categoryId === cat.id).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {services
                  .filter(s => s.categoryId === cat.id)
                  .map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={handleEdit}
                      onDelete={(s) => {
                        if (confirm('Delete this service?')) {
                          deleteService(s.id);
                        }
                      }}
                      onToggleActive={(s) => toggleServiceActive(s.id)}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No services"
                description={`Add your first ${cat.name.toLowerCase()} service`}
                action={{
                  label: 'Add Service',
                  onClick: () => {
                    setFormData({ ...formData, categoryId: cat.id });
                    setIsDialogOpen(true);
                  },
                }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
