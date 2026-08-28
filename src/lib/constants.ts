import type { ActivityType, ParkStatus } from '@/types/database';

export const PARK_STATUSES: ParkStatus[] = ['lead', 'contacted', 'negotiating', 'passed', 'closed'];

export const STATUS_LABELS: Record<ParkStatus, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  passed: 'Passed',
  closed: 'Closed',
};

export const STATUS_BADGE_CLASSES: Record<ParkStatus, string> = {
  lead: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  contacted: 'bg-blue-100 text-blue-700 ring-blue-500/20',
  negotiating: 'bg-amber-100 text-amber-700 ring-amber-500/20',
  passed: 'bg-red-100 text-red-700 ring-red-500/20',
  closed: 'bg-green-100 text-green-700 ring-green-500/20',
};

export const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'visit', 'other'];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  visit: 'Visit',
  other: 'Other',
};

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV',
  'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
  'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];
