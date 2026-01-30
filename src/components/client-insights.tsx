'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Gift, Heart, Users, 
  Clock, Star, Share2, TrendingUp 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export function ClientInsights() {
  const { 
    getClientsAtRisk, 
    getUpcomingBirthdays, 
    clients,
    loyaltySettings,
    referralSettings 
  } = useStore();
  
  const atRiskClients = getClientsAtRisk();
  const upcomingBirthdays = getUpcomingBirthdays();
  const clientsWithRewards = clients.filter(
    c => (c.loyaltyPoints || 0) >= loyaltySettings.rewardThreshold
  );
  const topReferrers = clients
    .filter(c => (c.referralCount || 0) > 0)
    .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
    .slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* At Risk Clients */}
      {atRiskClients.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Clients at Risk ({atRiskClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 mb-3">
              These clients haven't visited in 60+ days
            </p>
            <div className="space-y-2">
              {atRiskClients.slice(0, 3).map(({ client, daysSinceLastVisit }) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-white rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-warm-brown">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-orange-600">
                      {daysSinceLastVisit} days since last visit
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-300">
                    Send Reminder
                  </Button>
                </motion.div>
              ))}
            </div>
            {atRiskClients.length > 3 && (
              <Link href="/app/clients?filter=at-risk">
                <Button variant="ghost" className="w-full mt-2 text-orange-600">
                  View all {atRiskClients.length} at-risk clients →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card className="border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
              <Gift className="w-5 h-5" />
              Upcoming Birthdays ({upcomingBirthdays.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-pink-600 mb-3">
              Send a birthday treat!
            </p>
            <div className="space-y-2">
              {upcomingBirthdays.slice(0, 3).map(({ client }) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-white rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-warm-brown">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-pink-600">
                      🎂 {client.dateOfBirth && format(parseISO(client.dateOfBirth), 'MMM d')}
                    </p>
                  </div>
                  <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                    Send Offer
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Rewards Ready */}
      {clientsWithRewards.length > 0 && (
        <Card className="border-gold/30 bg-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-gold">
              <Star className="w-5 h-5" />
              Rewards Ready ({clientsWithRewards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              These clients can redeem a {loyaltySettings.rewardValue}% discount
            </p>
            <div className="space-y-2">
              {clientsWithRewards.slice(0, 3).map((client) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-white rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-warm-brown">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-gold">
                      ⭐ {client.loyaltyPoints} points ({client.loyaltyTier})
                    </p>
                  </div>
                  <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
                    {loyaltySettings.rewardValue}% off ready
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Top Referrers */}
      {topReferrers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-sage" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topReferrers.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between bg-sage/10 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-warm-brown">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Code: {client.referralCode}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-sage">
                    {client.referralCount} referrals
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Empty state */}
      {atRiskClients.length === 0 && 
       upcomingBirthdays.length === 0 && 
       clientsWithRewards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              All your clients are happy and engaged! 🎉
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
