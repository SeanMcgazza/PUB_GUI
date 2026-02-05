'use client';

import { useStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { StatCard } from '@/components/ui/stat-card';
import { BookingCard } from '@/components/cards/booking-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ClientInsights } from '@/components/client-insights';
import { BookingQRCode } from '@/components/booking-qr-code';
import { motion } from 'framer-motion';
import { 
  Calendar, Euro, Users, Clock, Plus, ArrowRight,
  TrendingUp, AlertCircle, CheckCircle, QrCode, Heart
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { profile } = useProfile();
  const {
    canViewRevenue,
    canViewBusinessStats,
    canViewClientInsights,
    showPersonalizedDashboard,
  } = useRoleAccess();
  const { 
    business, 
    getDashboardStats, 
    getUpcomingBookings, 
    getClientById, 
    getServiceById,
    updateBookingStatus,
    activities
  } = useStore();
  
  const stats = getDashboardStats();
  const upcomingBookings = getUpcomingBookings(5);
  const displayName = showPersonalizedDashboard
    ? (profile?.business_name || 'there')
    : (profile?.business_name || business.name || 'there');
  
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">
          {getGreeting()}, {displayName}! ✨
        </h1>
        <p className="text-muted-foreground mt-1">
          {showPersonalizedDashboard
            ? "Here's your schedule and stats for today."
            : `Here's what's happening at ${business.name} today.`}
        </p>
      </motion.div>
      
      {/* Stats Grid */}
      <div className={cn(
        'grid gap-4 mb-8',
        canViewBusinessStats ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'
      )}>
        <StatCard
          title={showPersonalizedDashboard ? "My Bookings Today" : "Today's Bookings"}
          value={stats.todayBookings}
          subtitle="appointments"
          icon={Calendar}
          iconColor="text-gold"
        />
        {canViewRevenue && (
          <StatCard
            title={showPersonalizedDashboard ? "My Revenue Today" : "Today's Revenue"}
            value={`€${stats.todayRevenue}`}
            subtitle="projected"
            icon={Euro}
            iconColor="text-sage"
          />
        )}
        {canViewBusinessStats && (
          <StatCard
            title="This Week"
            value={stats.weekBookings}
            subtitle={`€${stats.weekRevenue} revenue`}
            icon={TrendingUp}
            iconColor="text-lavender"
          />
        )}
        <StatCard
          title="Pending"
          value={stats.pendingBookings}
          subtitle="to confirm"
          icon={AlertCircle}
          iconColor="text-soft-gold"
        />
      </div>
      
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'grid gap-3 mb-8',
          canViewBusinessStats ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'
        )}
      >
        <Link href="/app/bookings/new">
          <Button className="w-full h-auto py-4 bg-gold hover:bg-gold-dark text-white flex flex-col gap-2">
            <Plus className="w-5 h-5" />
            <span>New Booking</span>
          </Button>
        </Link>
        <Link href="/app/clients/new">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
            <Users className="w-5 h-5" />
            <span>Add Client</span>
          </Button>
        </Link>
        <Link href="/app/calendar">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
            <Calendar className="w-5 h-5" />
            <span>{showPersonalizedDashboard ? 'My Schedule' : 'View Calendar'}</span>
          </Button>
        </Link>
        {canViewBusinessStats && (
          <Link href="/app/services">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Clock className="w-5 h-5" />
              <span>Services</span>
            </Button>
          </Link>
        )}
      </motion.div>
      
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">
                {showPersonalizedDashboard ? 'My Upcoming Appointments' : 'Upcoming Appointments'}
              </CardTitle>
              <Link href="/app/bookings">
                <Button variant="ghost" size="sm" className="text-gold">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => {
                    const client = getClientById(booking.clientId);
                    const service = getServiceById(booking.serviceId);
                    if (!client || !service) return null;
                    
                    return (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        client={client}
                        service={service}
                        showDate
                        onConfirm={(b) => updateBookingStatus(b.id, 'confirmed')}
                        onCancel={(b) => updateBookingStatus(b.id, 'cancelled')}
                        onComplete={(b) => updateBookingStatus(b.id, 'completed')}
                        onNoShow={(b) => updateBookingStatus(b.id, 'no-show')}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming appointments"
                  description={showPersonalizedDashboard 
                    ? "Your schedule is clear for now!" 
                    : "Your schedule is clear. Time to book some clients!"}
                  action={{
                    label: 'New Booking',
                    onClick: () => {},
                  }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Booking QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BookingQRCode />
        </motion.div>
      </div>
      
      {/* Client Insights & Activity — only for roles with access */}
      {(canViewClientInsights || canViewBusinessStats) && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client Insights */}
          {canViewClientInsights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-warm-brown flex items-center gap-2">
                  <Heart className="w-5 h-5 text-dusty-rose" />
                  Client Insights
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep your clients engaged and coming back
                </p>
              </div>
              <ClientInsights />
            </motion.div>
          )}
          
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={!canViewClientInsights ? 'lg:col-span-3' : ''}
          >
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${
                        activity.type === 'booking_created' ? 'bg-sage/20' :
                        activity.type === 'booking_completed' ? 'bg-lavender/20' :
                        activity.type === 'booking_cancelled' ? 'bg-dusty-rose/20' :
                        'bg-gold/20'
                      }`}>
                        {activity.type === 'booking_created' && <Plus className="w-3 h-3 text-sage" />}
                        {activity.type === 'booking_completed' && <CheckCircle className="w-3 h-3 text-lavender" />}
                        {activity.type === 'booking_cancelled' && <AlertCircle className="w-3 h-3 text-dusty-rose" />}
                        {activity.type === 'client_added' && <Users className="w-3 h-3 text-gold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-warm-brown">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Helper for conditional classnames (already in utils, but inline for clarity)
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
