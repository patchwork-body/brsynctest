export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      employee_groups: {
        Row: {
          assigned_at: string | null;
          assigned_by: string | null;
          employee_id: string;
          group_id: string;
          id: string;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          employee_id: string;
          group_id: string;
          id?: string;
        };
        Update: {
          assigned_at?: string | null;
          assigned_by?: string | null;
          employee_id?: string;
          group_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'employee_groups_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employee_with_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_groups_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      employees: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          department: string | null;
          email: string;
          employee_id: string | null;
          external_id: string | null;
          first_name: string;
          id: string;
          integration_id: string | null;
          job_title: string | null;
          last_name: string;
          manager_email: string | null;
          phone: string | null;
          status: Database['public']['Enums']['employee_status'];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          email: string;
          employee_id?: string | null;
          external_id?: string | null;
          first_name: string;
          id?: string;
          integration_id?: string | null;
          job_title?: string | null;
          last_name: string;
          manager_email?: string | null;
          phone?: string | null;
          status?: Database['public']['Enums']['employee_status'];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          department?: string | null;
          email?: string;
          employee_id?: string | null;
          external_id?: string | null;
          first_name?: string;
          id?: string;
          integration_id?: string | null;
          job_title?: string | null;
          last_name?: string;
          manager_email?: string | null;
          phone?: string | null;
          status?: Database['public']['Enums']['employee_status'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employees_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          external_id: string | null;
          id: string;
          integration_id: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          integration_id?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          external_id?: string | null;
          id?: string;
          integration_id?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          auth_data: Json | null;
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          last_sync_at: string | null;
          name: string;
          status: Database['public']['Enums']['integration_status'];
          type: Database['public']['Enums']['integration_type'];
          updated_at: string | null;
        };
        Insert: {
          auth_data?: Json | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          last_sync_at?: string | null;
          name: string;
          status?: Database['public']['Enums']['integration_status'];
          type: Database['public']['Enums']['integration_type'];
          updated_at?: string | null;
        };
        Update: {
          auth_data?: Json | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          last_sync_at?: string | null;
          name?: string;
          status?: Database['public']['Enums']['integration_status'];
          type?: Database['public']['Enums']['integration_type'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          completed_at: string | null;
          created_by: string | null;
          error_message: string | null;
          id: string;
          integration_id: string;
          records_created: number | null;
          records_failed: number | null;
          records_processed: number | null;
          records_updated: number | null;
          started_at: string | null;
          status: string;
          sync_type: string;
        };
        Insert: {
          completed_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          integration_id: string;
          records_created?: number | null;
          records_failed?: number | null;
          records_processed?: number | null;
          records_updated?: number | null;
          started_at?: string | null;
          status: string;
          sync_type: string;
        };
        Update: {
          completed_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          integration_id?: string;
          records_created?: number | null;
          records_failed?: number | null;
          records_processed?: number | null;
          records_updated?: number | null;
          started_at?: string | null;
          status?: string;
          sync_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sync_logs_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      employee_with_groups: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          department: string | null;
          email: string | null;
          employee_id: string | null;
          external_id: string | null;
          first_name: string | null;
          groups: Json | null;
          id: string | null;
          integration_id: string | null;
          job_title: string | null;
          last_name: string | null;
          manager_email: string | null;
          phone: string | null;
          status: Database['public']['Enums']['employee_status'] | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employees_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      get_integration_stats: {
        Args: { integration_uuid: string };
        Returns: Json;
      };
      sync_employees_from_integration: {
        Args: { employee_data: Json[]; integration_uuid: string };
        Returns: Json;
      };
    };
    Enums: {
      employee_status: 'active' | 'inactive' | 'terminated';
      integration_status: 'active' | 'inactive' | 'error' | 'pending_auth';
      integration_type: 'csv' | 'microsoft_entra' | 'google_workspace';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      employee_status: ['active', 'inactive', 'terminated'],
      integration_status: ['active', 'inactive', 'error', 'pending_auth'],
      integration_type: ['csv', 'microsoft_entra', 'google_workspace'],
    },
  },
} as const;
