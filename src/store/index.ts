import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Business, Staff, ServiceCategory, Service, Client, Booking, 
  Availability, Activity, DashboardStats, BookingStatus,
  LoyaltySettings, ReferralSettings, ClientInsight
} from '@/types';
import { 
  mockBusiness, mockStaff, mockCategories, mockServices, 
  mockClients, mockBookings, mockAvailability, mockActivities 
} from '@/data/mockData';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, isAfter } from 'date-fns';

interface StoreState {
  // Data
  business: Business;
  staff: Staff[];
  categories: ServiceCategory[];
  services: Service[];
  clients: Client[];
  bookings: Booking[];
  availability: Availability;
  activities: Activity[];
  loyaltySettings: LoyaltySettings;
  referralSettings: ReferralSettings;
  
  // Business
  updateBusiness: (data: Partial<Business>) => void;
  
  // Categories
  addCategory: (category: Omit<ServiceCategory, 'id'>) => void;
  updateCategory: (id: string, data: Partial<ServiceCategory>) => void;
  deleteCategory: (id: string) => void;
  
  // Services
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  
  // Clients
  addClient: (client: Omit<Client, 'id' | 'totalVisits' | 'totalSpent' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  
  // Bookings
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  deleteBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsForDate: (date: string) => Booking[];
  getBookingsForWeek: (date: Date) => Booking[];
  getUpcomingBookings: (limit?: number) => Booking[];
  
  // Availability
  updateAvailability: (availability: Availability) => void;
  
  // Activities
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  
  // Dashboard
  getDashboardStats: () => DashboardStats;
  
  // Helpers
  getServiceById: (id: string) => Service | undefined;
  getCategoryById: (id: string) => ServiceCategory | undefined;
  
  // Loyalty
  updateLoyaltySettings: (settings: Partial<LoyaltySettings>) => void;
  addLoyaltyPoints: (clientId: string, amount: number) => void;
  redeemLoyaltyReward: (clientId: string) => number; // returns discount amount
  
  // Referrals
  updateReferralSettings: (settings: Partial<ReferralSettings>) => void;
  applyReferralCode: (clientId: string, code: string) => boolean;
  getReferralDiscount: (clientId: string) => number;
  
  // Insights
  getClientsAtRisk: () => ClientInsight[];
  getUpcomingBirthdays: () => ClientInsight[];
  getClientInsights: () => ClientInsight[];
  generateReferralCode: (clientId: string) => string;
}

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial data
      business: mockBusiness,
      staff: mockStaff,
      categories: mockCategories,
      services: mockServices,
      clients: mockClients.map(c => ({
        ...c,
        loyaltyPoints: c.totalVisits * 10,
        loyaltyTier: c.totalVisits >= 20 ? 'platinum' : c.totalVisits >= 10 ? 'gold' : c.totalVisits >= 5 ? 'silver' : 'bronze',
        referralCode: `${c.firstName.toUpperCase().slice(0, 3)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        referralCount: 0,
      })),
      bookings: mockBookings,
      availability: mockAvailability,
      activities: mockActivities,
      
      // Loyalty defaults
      loyaltySettings: {
        enabled: true,
        pointsPerEuro: 1,
        rewardThreshold: 100,
        rewardType: 'percentage',
        rewardValue: 15,
        tiers: [
          { name: 'bronze', minPoints: 0, discountPercent: 0 },
          { name: 'silver', minPoints: 50, discountPercent: 5 },
          { name: 'gold', minPoints: 100, discountPercent: 10 },
          { name: 'platinum', minPoints: 200, discountPercent: 15 },
        ],
      },
      
      // Referral defaults
      referralSettings: {
        enabled: true,
        referrerReward: 10,
        refereeReward: 15,
      },
      
      // Business
      updateBusiness: (data) => set((state) => ({
        business: { ...state.business, ...data }
      })),
      
      // Categories
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: generateId('cat') }]
      })),
      
      updateCategory: (id, data) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),
      
      // Services
      addService: (service) => set((state) => ({
        services: [...state.services, { ...service, id: generateId('srv') }]
      })),
      
      updateService: (id, data) => set((state) => ({
        services: state.services.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      
      deleteService: (id) => set((state) => ({
        services: state.services.filter(s => s.id !== id)
      })),
      
      toggleServiceActive: (id) => set((state) => ({
        services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
      })),
      
      // Clients
      addClient: (clientData) => {
        const newClient: Client = {
          ...clientData,
          id: generateId('cli'),
          totalVisits: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ clients: [...state.clients, newClient] }));
        get().addActivity({ type: 'client_added', message: `New client: ${clientData.firstName} ${clientData.lastName}` });
      },
      
      updateClient: (id, data) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
      })),
      
      getClientById: (id) => get().clients.find(c => c.id === id),
      
      // Bookings
      addBooking: (bookingData) => {
        const newBooking: Booking = {
          ...bookingData,
          id: generateId('book'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({ bookings: [...state.bookings, newBooking] }));
        
        const client = get().getClientById(bookingData.clientId);
        const service = get().getServiceById(bookingData.serviceId);
        if (client && service) {
          get().addActivity({ 
            type: 'booking_created', 
            message: `New booking: ${client.firstName} ${client.lastName} for ${service.name}`,
            metadata: { clientId: client.id, bookingId: newBooking.id }
          });
        }
      },
      
      updateBooking: (id, data) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b)
      })),
      
      updateBookingStatus: (id, status) => {
        const booking = get().getBookingById(id);
        if (!booking) return;
        
        set((state) => ({
          bookings: state.bookings.map(b => 
            b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b
          )
        }));
        
        const client = get().getClientById(booking.clientId);
        const service = get().getServiceById(booking.serviceId);
        
        if (client && service) {
          if (status === 'completed') {
            // Update client stats
            set((state) => ({
              clients: state.clients.map(c => 
                c.id === booking.clientId 
                  ? { ...c, totalVisits: c.totalVisits + 1, totalSpent: c.totalSpent + booking.price, lastVisit: booking.date }
                  : c
              )
            }));
            get().addActivity({ 
              type: 'booking_completed', 
              message: `Completed: ${client.firstName} ${client.lastName} - ${service.name}`,
              metadata: { clientId: client.id, bookingId: id }
            });
          } else if (status === 'cancelled') {
            get().addActivity({ 
              type: 'booking_cancelled', 
              message: `Cancelled: ${client.firstName} ${client.lastName} - ${service.name}`,
              metadata: { clientId: client.id, bookingId: id }
            });
          }
        }
      },
      
      deleteBooking: (id) => set((state) => ({
        bookings: state.bookings.filter(b => b.id !== id)
      })),
      
      getBookingById: (id) => get().bookings.find(b => b.id === id),
      
      getBookingsForDate: (date) => {
        return get().bookings
          .filter(b => b.date === date && b.status !== 'cancelled')
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },
      
      getBookingsForWeek: (date) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        
        return get().bookings.filter(b => {
          const bookingDate = parseISO(b.date);
          return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd }) && b.status !== 'cancelled';
        }).sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      },
      
      getUpcomingBookings: (limit = 10) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const now = format(new Date(), 'HH:mm');
        
        return get().bookings
          .filter(b => {
            if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'no-show') return false;
            if (b.date > today) return true;
            if (b.date === today && b.startTime >= now) return true;
            return false;
          })
          .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
          })
          .slice(0, limit);
      },
      
      // Availability
      updateAvailability: (availability) => set({ availability }),
      
      // Activities
      addActivity: (activityData) => set((state) => ({
        activities: [
          { ...activityData, id: generateId('act'), timestamp: new Date().toISOString() },
          ...state.activities.slice(0, 49) // Keep last 50
        ]
      })),
      
      // Dashboard stats
      getDashboardStats: () => {
        const state = get();
        const today = format(new Date(), 'yyyy-MM-dd');
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const monthStart = startOfMonth(new Date());
        
        const todayBookings = state.bookings.filter(b => 
          b.date === today && b.status !== 'cancelled'
        );
        
        const weekBookings = state.bookings.filter(b => {
          const bookingDate = parseISO(b.date);
          return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd }) && 
                 b.status !== 'cancelled';
        });
        
        const pendingBookings = state.bookings.filter(b => b.status === 'pending');
        
        const newClientsThisMonth = state.clients.filter(c => 
          isAfter(parseISO(c.createdAt), monthStart)
        ).length;
        
        return {
          todayBookings: todayBookings.length,
          todayRevenue: todayBookings.reduce((sum, b) => sum + b.price, 0),
          weekBookings: weekBookings.length,
          weekRevenue: weekBookings.reduce((sum, b) => sum + b.price, 0),
          pendingBookings: pendingBookings.length,
          totalClients: state.clients.length,
          newClientsThisMonth,
        };
      },
      
      // Helpers
      getServiceById: (id) => get().services.find(s => s.id === id),
      getCategoryById: (id) => get().categories.find(c => c.id === id),
      
      // Loyalty
      updateLoyaltySettings: (settings) => set((state) => ({
        loyaltySettings: { ...state.loyaltySettings, ...settings }
      })),
      
      addLoyaltyPoints: (clientId, amount) => {
        const { loyaltySettings } = get();
        const points = Math.floor(amount * loyaltySettings.pointsPerEuro);
        
        set((state) => ({
          clients: state.clients.map(c => {
            if (c.id !== clientId) return c;
            const newPoints = (c.loyaltyPoints || 0) + points;
            const newTier = loyaltySettings.tiers
              .filter(t => newPoints >= t.minPoints)
              .sort((a, b) => b.minPoints - a.minPoints)[0]?.name || 'bronze';
            return { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier };
          })
        }));
      },
      
      redeemLoyaltyReward: (clientId) => {
        const { loyaltySettings, clients } = get();
        const client = clients.find(c => c.id === clientId);
        if (!client || (client.loyaltyPoints || 0) < loyaltySettings.rewardThreshold) return 0;
        
        set((state) => ({
          clients: state.clients.map(c => 
            c.id === clientId 
              ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) - loyaltySettings.rewardThreshold }
              : c
          )
        }));
        
        return loyaltySettings.rewardValue;
      },
      
      // Referrals
      updateReferralSettings: (settings) => set((state) => ({
        referralSettings: { ...state.referralSettings, ...settings }
      })),
      
      applyReferralCode: (clientId, code) => {
        const { clients } = get();
        const referrer = clients.find(c => c.referralCode === code && c.id !== clientId);
        if (!referrer) return false;
        
        set((state) => ({
          clients: state.clients.map(c => {
            if (c.id === clientId) return { ...c, referredBy: code };
            if (c.id === referrer.id) return { ...c, referralCount: (c.referralCount || 0) + 1 };
            return c;
          })
        }));
        
        get().addActivity({ 
          type: 'client_added', 
          message: `Referral: ${referrer.firstName} referred a new client!` 
        });
        
        return true;
      },
      
      getReferralDiscount: (clientId) => {
        const { referralSettings, clients } = get();
        const client = clients.find(c => c.id === clientId);
        if (!client?.referredBy) return 0;
        return referralSettings.refereeReward;
      },
      
      generateReferralCode: (clientId) => {
        const client = get().clients.find(c => c.id === clientId);
        if (!client) return '';
        return client.referralCode || `${client.firstName.toUpperCase().slice(0, 3)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      },
      
      // Insights
      getClientsAtRisk: () => {
        const { clients } = get();
        const today = new Date();
        
        return clients
          .filter(c => c.lastVisit)
          .map(c => {
            const lastVisit = parseISO(c.lastVisit!);
            const daysSince = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
            return {
              client: c,
              daysSinceLastVisit: daysSince,
              isAtRisk: daysSince >= 60,
              hasBirthdaySoon: false,
              canRedeemReward: (c.loyaltyPoints || 0) >= get().loyaltySettings.rewardThreshold,
            };
          })
          .filter(i => i.isAtRisk)
          .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
      },
      
      getUpcomingBirthdays: () => {
        const { clients } = get();
        const today = new Date();
        
        return clients
          .filter(c => c.dateOfBirth)
          .map(c => {
            const bday = parseISO(c.dateOfBirth!);
            const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
            if (thisYearBday < today) {
              thisYearBday.setFullYear(today.getFullYear() + 1);
            }
            const daysUntil = Math.floor((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              client: c,
              daysSinceLastVisit: c.lastVisit 
                ? Math.floor((today.getTime() - parseISO(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              isAtRisk: false,
              hasBirthdaySoon: daysUntil <= 14,
              canRedeemReward: (c.loyaltyPoints || 0) >= get().loyaltySettings.rewardThreshold,
              daysUntilBirthday: daysUntil,
            };
          })
          .filter(i => i.hasBirthdaySoon)
          .sort((a, b) => (a as any).daysUntilBirthday - (b as any).daysUntilBirthday);
      },
      
      getClientInsights: () => {
        const { clients } = get();
        const today = new Date();
        
        return clients.map(c => {
          const daysSince = c.lastVisit 
            ? Math.floor((today.getTime() - parseISO(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          let hasBirthdaySoon = false;
          if (c.dateOfBirth) {
            const bday = parseISO(c.dateOfBirth);
            const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
            if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.floor((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            hasBirthdaySoon = daysUntil <= 14;
          }
          
          return {
            client: c,
            daysSinceLastVisit: daysSince,
            isAtRisk: daysSince >= 60,
            hasBirthdaySoon,
            canRedeemReward: (c.loyaltyPoints || 0) >= get().loyaltySettings.rewardThreshold,
          };
        });
      },
    }),
    {
      name: 'chairtime-store',
      partialize: (state) => ({
        business: state.business,
        categories: state.categories,
        services: state.services,
        clients: state.clients,
        bookings: state.bookings,
        availability: state.availability,
        activities: state.activities,
      }),
    }
  )
);
