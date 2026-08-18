export type SpotStatus = "new" | "in_progress" | "done";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Spot {
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
}

export interface SpotVolunteer {
  spot_id: string;
  user_id: string;
  joined_at: string;
}

export interface SpotMessage {
  id: string;
  spot_id: string;
  user_id: string | null;
  message: string;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  spot_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; display_name: string }; Update: Partial<Profile> };
      spots: {
        Row: Spot;
        Insert: Partial<Spot> & { title: string; description: string; lat: number; lng: number; difficulty: number };
        Update: Partial<Spot>;
      };
      spot_volunteers: { Row: SpotVolunteer; Insert: SpotVolunteer; Update: Partial<SpotVolunteer> };
      spot_messages: { Row: SpotMessage; Insert: Partial<SpotMessage> & { spot_id: string; message: string }; Update: Partial<SpotMessage> };
      favorites: { Row: Favorite; Insert: Favorite; Update: Partial<Favorite> };
    };
  };
}
