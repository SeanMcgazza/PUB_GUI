'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientAvatar } from '@/components/ui/client-avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, UserCog, Mail, Phone } from 'lucide-react';

export default function StaffPage() {
  const { staff } = useStore();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Staff</h1>
          <p className="text-muted-foreground">
            {staff.length} team member{staff.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button className="bg-gold hover:bg-gold-dark text-white w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </motion.div>

      {staff.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-soft hover:shadow-soft-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <ClientAvatar name={member.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-warm-brown">{member.name}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            member.role === 'owner'
                              ? 'bg-gold/20 text-gold border-gold'
                              : member.role === 'stylist'
                                ? 'bg-lavender/20 text-purple-700 border-lavender'
                                : 'bg-muted text-muted-foreground'
                          }
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                        {!member.isActive && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {member.bio && (
                        <p className="text-sm text-muted-foreground mb-2">{member.bio}</p>
                      )}

                      <div className="space-y-1 text-sm text-muted-foreground">
                        {member.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </p>
                        )}
                        {member.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCog}
          title="No staff members"
          description="Add your team members to manage schedules and assignments"
          action={{
            label: 'Add Staff Member',
            onClick: () => {},
          }}
        />
      )}
    </div>
  );
}
