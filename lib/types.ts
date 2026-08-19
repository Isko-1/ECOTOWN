export type SpotStatus = "new" | "in_progress" | "done";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;   // номер телефона — доп. контакт волонтёра
  role: "user" | "admin";
  created_at: string;
};

export type Spot = {
  id: string;
  created_by: string | null;
  title: string;
  description: string;
  lat: number;
  lng: number;
  status: SpotStatus;
  difficulty: number;
  is_public: boolean;
  photo_before_url: string | null;
  photo_after_url: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  donation_goal: string | null;
  donation_kaspi_number: string | null;
};

export type SpotVolunteer = {
  spot_id: string;
  user_id: string;
  joined_at: string;
};

export type SpotMessage = {
  id: string;
  spot_id: string;
  user_id: string | null;
  message: string;
  created_at: string;
};

export type Favorite = {
  user_id: string;
  spot_id: string;
  created_at: string;
};

export type DonationStatus = "pending" | "approved" | "rejected" | "completed";

export type SpotDonation = {
  id: string;
  spot_id: string;
  requested_by: string;
  purpose_text: string;
  goal_amount: number;
  collected_amount: number;
  contact_phone: string | null;
  status: DonationStatus;
  created_at: string;
  approved_at: string | null;
};

export type DonationTransaction = {
  id: string;
  donation_id: string;
  amount: number;
  recorded_by: string | null;
  note: string | null;
  created_at: string;
};

export type AppSettings = {
  id: true;
  kaspi_number: string | null;
  commission_percent: number;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; display_name: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      spots: {
        Row: Spot;
        Insert: Partial<Spot> & { title: string; description: string; lat: number; lng: number; difficulty: number };
        Update: Partial<Spot>;
        Relationships: [
          {
            foreignKeyName: "spots_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      spot_volunteers: {
        Row: SpotVolunteer;
        Insert: Partial<SpotVolunteer> & { spot_id: string; user_id: string };
        Update: Partial<SpotVolunteer>;
        Relationships: [
          {
            foreignKeyName: "spot_volunteers_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spot_volunteers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      spot_messages: {
        Row: SpotMessage;
        Insert: Partial<SpotMessage> & { spot_id: string; message: string };
        Update: Partial<SpotMessage>;
        Relationships: [
          {
            foreignKeyName: "spot_messages_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spot_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: Favorite;
        Insert: Partial<Favorite> & { spot_id: string; user_id: string };
        Update: Partial<Favorite>;
        Relationships: [
          {
            foreignKeyName: "favorites_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      spot_donations: {
        Row: SpotDonation;
        Insert: Partial<SpotDonation> & {
          spot_id: string;
          requested_by: string;
          purpose_text: string;
          goal_amount: number;
        };
        Update: Partial<SpotDonation>;
        Relationships: [
          {
            foreignKeyName: "spot_donations_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          }
        ];
      };
      donation_transactions: {
        Row: DonationTransaction;
        Insert: Partial<DonationTransaction> & { donation_id: string; amount: number };
        Update: Partial<DonationTransaction>;
        Relationships: [
          {
            foreignKeyName: "donation_transactions_donation_id_fkey";
            columns: ["donation_id"];
            isOneToOne: false;
            referencedRelation: "spot_donations";
            referencedColumns: ["id"];
          }
        ];
      };
      app_settings: {
        Row: AppSettings;
        Insert: Partial<AppSettings>;
        Update: Partial<AppSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
