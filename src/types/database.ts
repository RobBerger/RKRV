export type ParkStatus = 'lead' | 'contacted' | 'negotiating' | 'passed' | 'closed';
export type ActivityType = 'call' | 'email' | 'visit' | 'other';

export type Park = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  asking_price: number | null;
  num_sites: number | null;
  status: ParkStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewPark = Omit<Park, 'id' | 'created_at' | 'updated_at'>;

export type Activity = {
  id: string;
  park_id: string;
  date: string;
  type: ActivityType;
  notes: string | null;
  created_at: string;
};

export type NewActivity = Omit<Activity, 'id' | 'created_at'>;

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      parks: {
        Row: Park;
        Insert: Partial<Park> & { name: string };
        Update: Partial<Park>;
        Relationships: [];
      };
      activity: {
        Row: Activity;
        Insert: Partial<Activity> & { park_id: string; type: ActivityType };
        Update: Partial<Activity>;
        Relationships: [
          {
            foreignKeyName: 'activity_park_id_fkey';
            columns: ['park_id'];
            isOneToOne: false;
            referencedRelation: 'parks';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
