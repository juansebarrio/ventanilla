/**
 * Tipos de la base, espejo de supabase/migrations/.
 *
 * Escritos a mano porque `supabase gen types --db-url` requiere Docker
 * (no disponible en este entorno). Para regenerarlos donde sí lo haya:
 *   pnpm db:types
 * El resultado debe coincidir con esta forma; si divergen, gana la base.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      administrations: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          slug?: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          administration_id: string;
          rol: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          administration_id: string;
          rol?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          administration_id?: string;
          rol?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          id: string;
          administration_id: string;
          direccion: string;
          alias: string;
          total_unidades: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          direccion: string;
          alias: string;
          total_unidades: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          direccion?: string;
          alias?: string;
          total_unidades?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "buildings_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
      units: {
        Row: {
          id: string;
          administration_id: string;
          building_id: string;
          piso: string;
          letra: string | null;
          uf_numero: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          building_id: string;
          piso: string;
          letra?: string | null;
          uf_numero: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          building_id?: string;
          piso?: string;
          letra?: string | null;
          uf_numero?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "units_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
        ];
      };
      residents: {
        Row: {
          id: string;
          administration_id: string;
          unit_id: string | null;
          nombre: string;
          telefono: string;
          verificado: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          unit_id?: string | null;
          nombre: string;
          telefono: string;
          verificado?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          unit_id?: string | null;
          nombre?: string;
          telefono?: string;
          verificado?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "residents_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "residents_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          administration_id: string;
          nombre: string;
          urgencia_default: string;
          ot_automatica: boolean;
          emergencia_posible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          nombre: string;
          urgencia_default: string;
          ot_automatica?: boolean;
          emergencia_posible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          nombre?: string;
          urgencia_default?: string;
          ot_automatica?: boolean;
          emergencia_posible?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
      claims: {
        Row: {
          id: string;
          administration_id: string;
          numero_publico: string;
          titulo: string;
          categoria_id: string | null;
          urgencia: string;
          ambito: string;
          estado: string;
          building_id: string;
          unit_id: string | null;
          resident_id: string | null;
          origen: string;
          is_seed: boolean;
          primera_respuesta_at: string | null;
          en_gestion_at: string | null;
          asignado_at: string | null;
          resuelto_at: string | null;
          cerrado_at: string | null;
          reabierto_at: string | null;
          derivado_at: string | null;
          ultima_actividad_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          numero_publico?: string;
          titulo: string;
          categoria_id?: string | null;
          urgencia: string;
          ambito: string;
          estado?: string;
          building_id: string;
          unit_id?: string | null;
          resident_id?: string | null;
          origen: string;
          is_seed?: boolean;
          primera_respuesta_at?: string | null;
          en_gestion_at?: string | null;
          asignado_at?: string | null;
          resuelto_at?: string | null;
          cerrado_at?: string | null;
          reabierto_at?: string | null;
          derivado_at?: string | null;
          ultima_actividad_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          numero_publico?: string;
          titulo?: string;
          categoria_id?: string | null;
          urgencia?: string;
          ambito?: string;
          estado?: string;
          building_id?: string;
          unit_id?: string | null;
          resident_id?: string | null;
          origen?: string;
          is_seed?: boolean;
          primera_respuesta_at?: string | null;
          en_gestion_at?: string | null;
          asignado_at?: string | null;
          resuelto_at?: string | null;
          cerrado_at?: string | null;
          reabierto_at?: string | null;
          derivado_at?: string | null;
          ultima_actividad_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claims_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_resident_id_fkey";
            columns: ["resident_id"];
            isOneToOne: false;
            referencedRelation: "residents";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_messages: {
        Row: {
          id: string;
          administration_id: string;
          claim_id: string;
          direccion: string;
          tipo: string;
          contenido: string | null;
          transcripcion: string | null;
          media_path: string | null;
          wa_message_id: string | null;
          is_seed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          claim_id: string;
          direccion: string;
          tipo: string;
          contenido?: string | null;
          transcripcion?: string | null;
          media_path?: string | null;
          wa_message_id?: string | null;
          is_seed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          claim_id?: string;
          direccion?: string;
          tipo?: string;
          contenido?: string | null;
          transcripcion?: string | null;
          media_path?: string | null;
          wa_message_id?: string | null;
          is_seed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_messages_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_messages_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_events: {
        Row: {
          id: string;
          administration_id: string;
          claim_id: string;
          tipo: string;
          texto: string;
          actor: string;
          is_seed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          claim_id: string;
          tipo: string;
          texto: string;
          actor?: string;
          is_seed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          claim_id?: string;
          tipo?: string;
          texto?: string;
          actor?: string;
          is_seed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_events_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_events_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
        ];
      };
      providers: {
        Row: {
          id: string;
          administration_id: string;
          nombre: string;
          rubro: string;
          contacto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          nombre: string;
          rubro: string;
          contacto: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          nombre?: string;
          rubro?: string;
          contacto?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "providers_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_buildings: {
        Row: {
          administration_id: string;
          provider_id: string;
          building_id: string;
          created_at: string;
        };
        Insert: {
          administration_id: string;
          provider_id: string;
          building_id: string;
          created_at?: string;
        };
        Update: {
          administration_id?: string;
          provider_id?: string;
          building_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_buildings_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_buildings_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_buildings_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
        ];
      };
      work_orders: {
        Row: {
          id: string;
          administration_id: string;
          numero_publico: string;
          claim_id: string;
          provider_id: string;
          texto_enviado: string;
          estado: string;
          visita_confirmada: string | null;
          is_seed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          numero_publico?: string;
          claim_id: string;
          provider_id: string;
          texto_enviado: string;
          estado?: string;
          visita_confirmada?: string | null;
          is_seed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          numero_publico?: string;
          claim_id?: string;
          provider_id?: string;
          texto_enviado?: string;
          estado?: string;
          visita_confirmada?: string | null;
          is_seed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_orders_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_orders_claim_id_fkey";
            columns: ["claim_id"];
            isOneToOne: false;
            referencedRelation: "claims";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_orders_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      arrears: {
        Row: {
          id: string;
          administration_id: string;
          building_id: string;
          unit_id: string | null;
          resident_nombre: string;
          periodos_adeudados: number;
          monto: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          building_id: string;
          unit_id?: string | null;
          resident_nombre: string;
          periodos_adeudados: number;
          monto: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          building_id?: string;
          unit_id?: string | null;
          resident_nombre?: string;
          periodos_adeudados?: number;
          monto?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arrears_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arrears_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arrears_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: {
          scope: string;
          bucket_key: string;
          window_start: string;
          count: number;
          created_at: string;
        };
        Insert: {
          scope: string;
          bucket_key: string;
          window_start: string;
          count?: number;
          created_at?: string;
        };
        Update: {
          scope?: string;
          bucket_key?: string;
          window_start?: string;
          count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      counters: {
        Row: {
          administration_id: string;
          scope: string;
          value: number;
          created_at: string;
        };
        Insert: {
          administration_id: string;
          scope: string;
          value: number;
          created_at?: string;
        };
        Update: {
          administration_id?: string;
          scope?: string;
          value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counters_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_sessions: {
        Row: {
          id: string;
          administration_id: string;
          telefono: string;
          paso: string;
          datos: Json;
          ultimo_wamid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          administration_id: string;
          telefono: string;
          paso: string;
          datos?: Json;
          ultimo_wamid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          administration_id?: string;
          telefono?: string;
          paso?: string;
          datos?: Json;
          ultimo_wamid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wa_sessions_administration_id_fkey";
            columns: ["administration_id"];
            isOneToOne: false;
            referencedRelation: "administrations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_member: {
        Args: { p_administration_id: string };
        Returns: boolean;
      };
      next_public_number: {
        Args: { p_administration_id: string; p_scope: string };
        Returns: number;
      };
      rate_limit_hit: {
        Args: { p_scope: string; p_bucket_key: string; p_window_start: string };
        Returns: number;
      };
      rate_limit_purga: {
        Args: { p_antes: string };
        Returns: undefined;
      };
      demo_reset: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
