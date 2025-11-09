// Mock data for Customers page

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  totalOrdersLifetime: number;
  activeOrders: number;
  totalRevenueYTD: number;
  averageMarginPct: number;
  paymentTerms: string;
  status: 'active' | 'inactive' | 'high-value';
  aiScore: number; // 0-100
}

export interface CustomerContact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface CustomerProfile {
  companyInfo: {
    legalName: string;
    dba?: string;
    industry: string;
    since: string;
  };
  contacts: CustomerContact[];
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentTerms: string;
  creditLimit: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  origin: string;
  destination: string;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  revenue: number;
  margin: number;
}

export interface LaneData {
  origin: string;
  destination: string;
  orderCount: number;
  avgRevenue: number;
  avgMargin: number;
}

export interface AnalyticsData {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  orderFrequency: {
    avgPerMonth: number;
    trend: 'up' | 'down' | 'stable';
  };
  marginAnalysis: {
    avgMargin: number;
    bestMargin: number;
    worstMargin: number;
  };
  onTimeRate: number;
  aiInsights: string[];
}

export interface PricingHistory {
  lane: string;
  contractRate?: number;
  historicalRates: Array<{ date: string; rate: number }>;
  accessorialRates: Record<string, number>;
}

export interface DocumentItem {
  id: string;
  type: 'contract' | 'rate-confirmation' | 'insurance' | 'invoice';
  name: string;
  uploadDate: string;
  size: string;
}

// Mock customers
export const customers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Acme Logistics Corp',
    contactName: 'Sarah Johnson',
    contactEmail: 'sjohnson@acmelogistics.com',
    contactPhone: '(312) 555-0100',
    totalOrdersLifetime: 1247,
    activeOrders: 12,
    totalRevenueYTD: 3456789,
    averageMarginPct: 18.4,
    paymentTerms: 'Net 30',
    status: 'high-value',
    aiScore: 94,
  },
  {
    id: 'CUST-002',
    name: 'Midwest Distribution LLC',
    contactName: 'Mike Chen',
    contactEmail: 'mchen@midwest-dist.com',
    contactPhone: '(317) 555-0200',
    totalOrdersLifetime: 834,
    activeOrders: 8,
    totalRevenueYTD: 1823456,
    averageMarginPct: 14.2,
    paymentTerms: 'Net 45',
    status: 'active',
    aiScore: 78,
  },
  {
    id: 'CUST-003',
    name: 'Great Lakes Freight Inc',
    contactName: 'Jennifer Lopez',
    contactEmail: 'jlopez@greatlakes.com',
    contactPhone: '(414) 555-0300',
    totalOrdersLifetime: 2103,
    activeOrders: 18,
    totalRevenueYTD: 5234567,
    averageMarginPct: 21.6,
    paymentTerms: 'Net 30',
    status: 'high-value',
    aiScore: 97,
  },
  {
    id: 'CUST-004',
    name: 'Central Warehousing Co',
    contactName: 'Robert Smith',
    contactEmail: 'rsmith@centralwarehouse.com',
    contactPhone: '(513) 555-0400',
    totalOrdersLifetime: 412,
    activeOrders: 3,
    totalRevenueYTD: 623890,
    averageMarginPct: 9.8,
    paymentTerms: 'Net 60',
    status: 'active',
    aiScore: 62,
  },
  {
    id: 'CUST-005',
    name: 'Express Delivery Solutions',
    contactName: 'Amanda White',
    contactEmail: 'awhite@expressdelivery.com',
    contactPhone: '(216) 555-0500',
    totalOrdersLifetime: 89,
    activeOrders: 0,
    totalRevenueYTD: 45600,
    averageMarginPct: 6.3,
    paymentTerms: 'Net 30',
    status: 'inactive',
    aiScore: 41,
  },
];

// Detailed profile for a customer
export const getCustomerProfile = (customerId: string): CustomerProfile => ({
  companyInfo: {
    legalName: 'Acme Logistics Corporation',
    dba: 'Acme Logistics',
    industry: 'Retail Distribution',
    since: '2015-03-15',
  },
  contacts: [
    {
      id: 'C1',
      name: 'Sarah Johnson',
      title: 'VP Operations',
      email: 'sjohnson@acmelogistics.com',
      phone: '(312) 555-0100',
      isPrimary: true,
    },
    {
      id: 'C2',
      name: 'David Kim',
      title: 'Logistics Manager',
      email: 'dkim@acmelogistics.com',
      phone: '(312) 555-0101',
      isPrimary: false,
    },
    {
      id: 'C3',
      name: 'Emily Chen',
      title: 'Accounts Payable',
      email: 'echen@acmelogistics.com',
      phone: '(312) 555-0102',
      isPrimary: false,
    },
  ],
  billingAddress: {
    street: '1234 Commerce Drive',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    country: 'USA',
  },
  paymentTerms: 'Net 30',
  creditLimit: 500000,
});

// Customer orders
export const getCustomerOrders = (customerId: string): CustomerOrder[] => [
  {
    id: 'ORD-1024',
    orderNumber: 'ACM-1024',
    date: '2025-11-08',
    origin: 'Chicago, IL',
    destination: 'Indianapolis, IN',
    status: 'in-progress',
    revenue: 1850,
    margin: 18.2,
  },
  {
    id: 'ORD-1018',
    orderNumber: 'ACM-1018',
    date: '2025-11-06',
    origin: 'St. Louis, MO',
    destination: 'Chicago, IL',
    status: 'completed',
    revenue: 1620,
    margin: 21.4,
  },
  {
    id: 'ORD-1005',
    orderNumber: 'ACM-1005',
    date: '2025-11-03',
    origin: 'Kansas City, MO',
    destination: 'St. Louis, MO',
    status: 'completed',
    revenue: 980,
    margin: 16.8,
  },
  {
    id: 'ORD-0998',
    orderNumber: 'ACM-0998',
    date: '2025-10-30',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    status: 'completed',
    revenue: 1420,
    margin: 19.5,
  },
];

// Favorite lanes
export const getFavoriteLanes = (customerId: string): LaneData[] => [
  { origin: 'Chicago, IL', destination: 'Indianapolis, IN', orderCount: 124, avgRevenue: 1820, avgMargin: 18.6 },
  { origin: 'St. Louis, MO', destination: 'Chicago, IL', orderCount: 89, avgRevenue: 1650, avgMargin: 20.2 },
  { origin: 'Kansas City, MO', destination: 'St. Louis, MO', orderCount: 67, avgRevenue: 995, avgMargin: 15.8 },
];

// Analytics data
export const getCustomerAnalytics = (customerId: string): AnalyticsData => ({
  revenueByMonth: [
    { month: 'May', revenue: 245000 },
    { month: 'Jun', revenue: 268000 },
    { month: 'Jul', revenue: 289000 },
    { month: 'Aug', revenue: 312000 },
    { month: 'Sep', revenue: 298000 },
    { month: 'Oct', revenue: 334000 },
  ],
  orderFrequency: {
    avgPerMonth: 42,
    trend: 'up',
  },
  marginAnalysis: {
    avgMargin: 18.4,
    bestMargin: 24.8,
    worstMargin: 8.2,
  },
  onTimeRate: 96.2,
  aiInsights: [
    'Revenue up 23% this quarter compared to Q2',
    'On-time delivery rate improved by 4.2% over last 90 days',
    'Chicago-Indianapolis lane shows strongest margin growth',
    'Customer ordering frequency trending upward—consider volume discount tier',
  ],
});

// Pricing history
export const getCustomerPricing = (customerId: string): PricingHistory[] => [
  {
    lane: 'Chicago, IL → Indianapolis, IN',
    contractRate: 2.85,
    historicalRates: [
      { date: '2025-10-01', rate: 2.85 },
      { date: '2025-07-01', rate: 2.78 },
      { date: '2025-04-01', rate: 2.72 },
    ],
    accessorialRates: {
      'Liftgate': 75,
      'Inside Delivery': 125,
      'Detention (per hour)': 65,
    },
  },
  {
    lane: 'St. Louis, MO → Chicago, IL',
    contractRate: 2.92,
    historicalRates: [
      { date: '2025-10-01', rate: 2.92 },
      { date: '2025-07-01', rate: 2.88 },
      { date: '2025-04-01', rate: 2.80 },
    ],
    accessorialRates: {
      'Liftgate': 75,
      'Inside Delivery': 125,
      'Detention (per hour)': 65,
    },
  },
];

// Documents
export const getCustomerDocuments = (customerId: string): DocumentItem[] => [
  {
    id: 'DOC-001',
    type: 'contract',
    name: 'Master Service Agreement 2025.pdf',
    uploadDate: '2025-01-15',
    size: '2.4 MB',
  },
  {
    id: 'DOC-002',
    type: 'insurance',
    name: 'Certificate of Insurance.pdf',
    uploadDate: '2025-01-20',
    size: '1.1 MB',
  },
  {
    id: 'DOC-003',
    type: 'rate-confirmation',
    name: 'Rate Confirmation Oct 2025.pdf',
    uploadDate: '2025-10-01',
    size: '324 KB',
  },
  {
    id: 'DOC-004',
    type: 'invoice',
    name: 'Invoice #INV-2025-10-1024.pdf',
    uploadDate: '2025-10-15',
    size: '198 KB',
  },
  {
    id: 'DOC-005',
    type: 'invoice',
    name: 'Invoice #INV-2025-09-0987.pdf',
    uploadDate: '2025-09-18',
    size: '210 KB',
  },
];

export const aiPricingRecommendations = [
  {
    lane: 'Chicago, IL → Indianapolis, IN',
    currentRate: 2.85,
    recommendedRate: 3.00,
    reasoning: 'Market rate increased 8% over last quarter. Renegotiate to maintain margin.',
  },
  {
    lane: 'St. Louis, MO → Chicago, IL',
    currentRate: 2.92,
    recommendedRate: 2.95,
    reasoning: 'Slight market adjustment recommended. Volume justifies minor increase.',
  },
];
