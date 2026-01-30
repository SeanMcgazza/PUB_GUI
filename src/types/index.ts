// Business Types
export interface Business {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  logo?: string;
  coverImage?: string;
  currency: string;
  timezone: string;
  bookingNotice: number; // hours in advance
  cancellationPolicy: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'stylist' | 'assistant';
  avatar?: string;
  bio?: string;
  isActive: boolean;
}

// Service Types
export interface ServiceCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  order: number;
}

export interface Service {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number;
  isActive: boolean;
  color?: string;
}

// Client Types
export interface Client {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: string; // For birthday discounts
  hairFormula?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
  // Loyalty (optional - will be set when first booking)
  loyaltyPoints?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  // Referrals
  referralCode?: string;
  referredBy?: string; // referral code of person who referred them
  referralCount?: number; // how many people they've referred
}

// Loyalty Program Types
export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuro: number; // e.g., 1 point per €1 spent
  rewardThreshold: number; // e.g., 100 points = reward
  rewardType: 'percentage' | 'fixed';
  rewardValue: number; // e.g., 10 (10% or €10)
  tiers: LoyaltyTier[];
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minPoints: number;
  discountPercent: number;
}

// Referral Program Types
export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number; // % off for person who refers
  refereeReward: number; // % off for new client
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface Booking {
  id: string;
  businessId: string;
  clientId: string;
  serviceId: string;
  staffId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Availability Types
export interface TimeBlock {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface DayAvailability {
  dayOfWeek: number; // 0-6, 0 = Sunday
  isOpen: boolean;
  blocks: TimeBlock[];
  breaks: TimeBlock[];
}

export interface Availability {
  businessId: string;
  schedule: DayAvailability[];
}

// Dashboard Types
export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  weekBookings: number;
  weekRevenue: number;
  pendingBookings: number;
  totalClients: number;
  newClientsThisMonth: number;
  noShowsThisMonth?: number;
  loyaltyRedemptions?: number;
  referralsThisMonth?: number;
}

// Client Insights
export interface ClientInsight {
  client: Client;
  daysSinceLastVisit: number;
  isAtRisk: boolean; // 60+ days
  hasBirthdaySoon: boolean; // within 14 days
  canRedeemReward: boolean;
}

// Form Types
export interface BookingFormData {
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hairFormula?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
}

export interface ServiceFormData {
  categoryId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'booking_created' | 'booking_cancelled' | 'client_added' | 'booking_completed';
  message: string;
  timestamp: string;
  metadata?: Record<string, string>;
}
