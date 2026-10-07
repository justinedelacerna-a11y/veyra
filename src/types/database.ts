export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string
          actor_role: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          details: string
          id: string
          ip_address: unknown
          resource_id: string
          resource_type: string
          result: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          details: string
          id?: string
          ip_address?: unknown
          resource_id: string
          resource_type: string
          result: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          details?: string
          id?: string
          ip_address?: unknown
          resource_id?: string
          resource_type?: string
          result?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
          type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          city: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          timezone: string
          updated_at?: string
        }
        Update: {
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_documents: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string | null
          file_size_bytes: number
          id: string
          mime_type: string
          original_filename: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string | null
          file_size_bytes: number
          id?: string
          mime_type: string
          original_filename: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_filename?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          membership_number: string
          membership_tier: string
          phone: string | null
          phone_verified: boolean
          preferred_hub_id: string | null
          total_rentals: number
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          last_name: string
          membership_number: string
          membership_tier?: string
          phone?: string | null
          phone_verified?: boolean
          preferred_hub_id?: string | null
          total_rentals?: number
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          membership_number?: string
          membership_tier?: string
          phone?: string | null
          phone_verified?: boolean
          preferred_hub_id?: string | null
          total_rentals?: number
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customers_preferred_hub"
            columns: ["preferred_hub_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_reports: {
        Row: {
          area: string
          charge_amount: number | null
          created_at: string
          description: string
          id: string
          inspection_id: string
          pre_existing: boolean
          reservation_id: string
          severity: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          area: string
          charge_amount?: number | null
          created_at?: string
          description: string
          id?: string
          inspection_id: string
          pre_existing: boolean
          reservation_id: string
          severity: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          area?: string
          charge_amount?: number | null
          created_at?: string
          description?: string
          id?: string
          inspection_id?: string
          pre_existing?: boolean
          reservation_id?: string
          severity?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          authorized_at: string | null
          created_at: string
          currency: string
          forfeited_amount: number | null
          id: string
          provider_hold_id: string | null
          release_notes: string | null
          released_at: string | null
          reservation_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          forfeited_amount?: number | null
          id?: string
          provider_hold_id?: string | null
          release_notes?: string | null
          released_at?: string | null
          reservation_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          forfeited_amount?: number | null
          id?: string
          provider_hold_id?: string | null
          release_notes?: string | null
          released_at?: string | null
          reservation_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      extras: {
        Row: {
          category: string
          created_at: string
          currency: string
          daily_rate: number
          description: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          daily_rate: number
          description: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          daily_rate?: number
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      inspection_check_items: {
        Row: {
          area: string
          id: string
          inspection_id: string
          notes: string | null
          status: string
        }
        Insert: {
          area: string
          id?: string
          inspection_id: string
          notes?: string | null
          status: string
        }
        Update: {
          area?: string
          id?: string
          inspection_id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_check_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          completed_at: string
          created_at: string
          customer_present: boolean
          customer_signature: boolean
          damage_status: string
          fuel_level_pct: number
          id: string
          inspector_id: string
          notes: string | null
          odometer_km: number
          overall_status: string
          reservation_id: string
          type: string
          vehicle_id: string
        }
        Insert: {
          completed_at: string
          created_at?: string
          customer_present: boolean
          customer_signature?: boolean
          damage_status?: string
          fuel_level_pct: number
          id?: string
          inspector_id: string
          notes?: string | null
          odometer_km: number
          overall_status: string
          reservation_id: string
          type: string
          vehicle_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          customer_present?: boolean
          customer_signature?: boolean
          damage_status?: string
          fuel_level_pct?: number
          id?: string
          inspector_id?: string
          notes?: string | null
          odometer_km?: number
          overall_status?: string
          reservation_id?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          barangay: string | null
          branch_id: string
          city: string
          created_at: string
          id: string
          name: string
          operating_hours: string
          pickup_available: boolean
          pickup_enabled: boolean
          province: string
          return_available: boolean
          return_enabled: boolean
          status: string
          timezone: string
          type: string
          updated_at: string
        }
        Insert: {
          address: string
          barangay?: string | null
          branch_id: string
          city: string
          created_at?: string
          id?: string
          name: string
          operating_hours: string
          pickup_available?: boolean
          pickup_enabled?: boolean
          province?: string
          return_available?: boolean
          return_enabled?: boolean
          status?: string
          timezone: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string
          barangay?: string | null
          branch_id?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          operating_hours?: string
          pickup_available?: boolean
          pickup_enabled?: boolean
          province?: string
          return_available?: boolean
          return_enabled?: boolean
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          actual_cost: number | null
          branch_id: string
          completed_date: string | null
          created_at: string
          created_by: string
          currency: string
          estimated_cost: number | null
          id: string
          notes: string | null
          odometer_at_service: number | null
          priority: string
          provider: string | null
          scheduled_date: string
          status: string
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_cost?: number | null
          branch_id: string
          completed_date?: string | null
          created_at?: string
          created_by: string
          currency?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          odometer_at_service?: number | null
          priority?: string
          provider?: string | null
          scheduled_date: string
          status?: string
          type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_cost?: number | null
          branch_id?: string
          completed_date?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          odometer_at_service?: number | null
          priority?: string
          provider?: string | null
          scheduled_date?: string
          status?: string
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          failure_reason: string | null
          id: string
          payload: Json
          retry_count: number
          scheduled_for: string
          sent_at: string | null
          status: string
          template_id: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          failure_reason?: string | null
          id?: string
          payload: Json
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          template_id: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          failure_reason?: string | null
          id?: string
          payload?: Json
          retry_count?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          method: string | null
          notes: string | null
          provider: string | null
          provider_payment_id: string | null
          provider_txn_ref: string | null
          reservation_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_id: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          method?: string | null
          notes?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_txn_ref?: string | null
          reservation_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          method?: string | null
          notes?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_txn_ref?: string | null
          reservation_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_extras: {
        Row: {
          daily_rate: number
          extra_id: string
          extra_name: string
          id: string
          quote_id: string
          total: number
        }
        Insert: {
          daily_rate: number
          extra_id: string
          extra_name: string
          id?: string
          quote_id: string
          total: number
        }
        Update: {
          daily_rate?: number
          extra_id?: string
          extra_name?: string
          id?: string
          quote_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_extras_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          base_rental: number
          created_at: string
          currency: string
          customer_id: string
          daily_rate: number
          discount_amount: number
          expires_at: string
          extras_subtotal: number
          id: string
          pickup_at: string
          pickup_location_id: string
          pricing_version: string
          rental_days: number
          return_at: string
          return_location_id: string
          security_deposit: number
          status: string
          subtotal: number
          tax_amount: number
          total_rental: number
          vehicle_id: string
        }
        Insert: {
          base_rental: number
          created_at?: string
          currency?: string
          customer_id: string
          daily_rate: number
          discount_amount?: number
          expires_at: string
          extras_subtotal?: number
          id?: string
          pickup_at: string
          pickup_location_id: string
          pricing_version: string
          rental_days: number
          return_at: string
          return_location_id: string
          security_deposit: number
          status?: string
          subtotal: number
          tax_amount?: number
          total_rental: number
          vehicle_id: string
        }
        Update: {
          base_rental?: number
          created_at?: string
          currency?: string
          customer_id?: string
          daily_rate?: number
          discount_amount?: number
          expires_at?: string
          extras_subtotal?: number
          id?: string
          pickup_at?: string
          pickup_location_id?: string
          pricing_version?: string
          rental_days?: number
          return_at?: string
          return_location_id?: string
          security_deposit?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_rental?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_return_location_id_fkey"
            columns: ["return_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          created_at: string
          daily_rate_override: number | null
          discount_pct: number | null
          id: string
          is_active: boolean
          max_days: number | null
          min_days: number
          name: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          vehicle_class_id: string | null
        }
        Insert: {
          created_at?: string
          daily_rate_override?: number | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days: number
          name: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_class_id?: string | null
        }
        Update: {
          created_at?: string
          daily_rate_override?: number | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean
          max_days?: number | null
          min_days?: number
          name?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          vehicle_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_vehicle_class_id_fkey"
            columns: ["vehicle_class_id"]
            isOneToOne: false
            referencedRelation: "vehicle_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          initiated_by: string
          payment_id: string
          provider_refund_id: string | null
          reason: string
          reservation_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          initiated_by: string
          payment_id: string
          provider_refund_id?: string | null
          reason: string
          reservation_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          initiated_by?: string
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string
          reservation_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_drivers: {
        Row: {
          created_at: string
          date_of_birth: string
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          license_country: string
          license_expiry: string | null
          license_number: string
          phone: string | null
          reservation_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name: string
          license_country: string
          license_expiry?: string | null
          license_number: string
          phone?: string | null
          reservation_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          license_country?: string
          license_expiry?: string | null
          license_number?: string
          phone?: string | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_drivers_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_extras: {
        Row: {
          daily_rate: number
          extra_id: string
          extra_name: string
          id: string
          reservation_id: string
          total: number
        }
        Insert: {
          daily_rate: number
          extra_id: string
          extra_name: string
          id?: string
          reservation_id: string
          total: number
        }
        Update: {
          daily_rate?: number
          extra_id?: string
          extra_name?: string
          id?: string
          reservation_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_extras_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          actual_pickup_at: string | null
          actual_return_at: string | null
          assigned_vehicle_id: string | null
          cancellation_reason: string | null
          created_at: string
          currency: string
          customer_id: string
          deposit_amount: number
          hold_expires_at: string | null
          id: string
          idempotency_key: string | null
          internal_notes: string | null
          payment_method: string | null
          payment_status: string
          pickup_at: string
          pickup_location_id: string
          quote_id: string
          reference: string
          rental_days: number
          return_at: string
          return_location_id: string
          status: string
          total_amount: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_pickup_at?: string | null
          actual_return_at?: string | null
          assigned_vehicle_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          deposit_amount: number
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_at: string
          pickup_location_id: string
          quote_id: string
          reference: string
          rental_days: number
          return_at: string
          return_location_id: string
          status?: string
          total_amount: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_pickup_at?: string | null
          actual_return_at?: string | null
          assigned_vehicle_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          deposit_amount?: number
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_at?: string
          pickup_location_id?: string
          quote_id?: string
          reference?: string
          rental_days?: number
          return_at?: string
          return_location_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_return_location_id_fkey"
            columns: ["return_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          branch_id: string | null
          created_at: string
          employee_id: string
          first_name: string
          id: string
          joined_date: string
          last_name: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          employee_id: string
          first_name: string
          id?: string
          joined_date: string
          last_name: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          employee_id?: string
          first_name?: string
          id?: string
          joined_date?: string
          last_name?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_users_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string
          deleted_at: string | null
          email: string
          email_verified: boolean
          id: string
          status: string
          updated_at: string
          user_type: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          email_verified?: boolean
          id?: string
          status?: string
          updated_at?: string
          user_type: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          email_verified?: boolean
          id?: string
          status?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      vehicle_classes: {
        Row: {
          base_daily_rate: number
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_daily_rate: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_daily_rate?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_features: {
        Row: {
          feature: string
          id: string
          vehicle_id: string
        }
        Insert: {
          feature: string
          id?: string
          vehicle_id: string
        }
        Update: {
          feature?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_features_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_features_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          sort_order: number
          storage_path: string
          vehicle_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path: string
          vehicle_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          sort_order?: number
          storage_path?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          bucket: string
          created_at: string
          id: string
          sort_order: number
          storage_path: string
          type: string
          uploaded_by: string
          vehicle_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_path: string
          type: string
          uploaded_by: string
          vehicle_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          sort_order?: number
          storage_path?: string
          type?: string
          uploaded_by?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_date: string
          branch_id: string
          color: string | null
          condition: string
          created_at: string
          currency: string
          daily_rate: number
          deleted_at: string | null
          doors: number | null
          excess_mileage_rate: number | null
          fleet_status: string
          fuel_level_pct: number
          fuel_type: string
          id: string
          internal_notes: string | null
          last_inspection_date: string | null
          location_id: string | null
          luggage_capacity: number
          make: string
          mileage_allowance_km: number | null
          model: string
          next_maintenance_due: string | null
          next_maintenance_odometer: number | null
          odometer_km: number
          plate_number: string
          seats: number
          security_deposit: number
          transmission: string
          updated_at: string
          vehicle_class_id: string
          vin: string
          year: number
        }
        Insert: {
          acquisition_date: string
          branch_id: string
          color?: string | null
          condition?: string
          created_at?: string
          currency?: string
          daily_rate: number
          deleted_at?: string | null
          doors?: number | null
          excess_mileage_rate?: number | null
          fleet_status?: string
          fuel_level_pct?: number
          fuel_type: string
          id?: string
          internal_notes?: string | null
          last_inspection_date?: string | null
          location_id?: string | null
          luggage_capacity: number
          make: string
          mileage_allowance_km?: number | null
          model: string
          next_maintenance_due?: string | null
          next_maintenance_odometer?: number | null
          odometer_km?: number
          plate_number: string
          seats: number
          security_deposit: number
          transmission: string
          updated_at?: string
          vehicle_class_id: string
          vin: string
          year: number
        }
        Update: {
          acquisition_date?: string
          branch_id?: string
          color?: string | null
          condition?: string
          created_at?: string
          currency?: string
          daily_rate?: number
          deleted_at?: string | null
          doors?: number | null
          excess_mileage_rate?: number | null
          fleet_status?: string
          fuel_level_pct?: number
          fuel_type?: string
          id?: string
          internal_notes?: string | null
          last_inspection_date?: string | null
          location_id?: string | null
          luggage_capacity?: number
          make?: string
          mileage_allowance_km?: number | null
          model?: string
          next_maintenance_due?: string | null
          next_maintenance_odometer?: number | null
          odometer_km?: number
          plate_number?: string
          seats?: number
          security_deposit?: number
          transmission?: string
          updated_at?: string
          vehicle_class_id?: string
          vin?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_class_id_fkey"
            columns: ["vehicle_class_id"]
            isOneToOne: false
            referencedRelation: "vehicle_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          failure_reason: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string
          retry_count: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          failure_reason?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          provider_event_id: string
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          failure_reason?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vehicle_catalog: {
        Row: {
          barangay: string | null
          branch_id: string | null
          color: string | null
          created_at: string | null
          currency: string | null
          daily_rate: number | null
          doors: number | null
          excess_mileage_rate: number | null
          fleet_status: string | null
          fuel_type: string | null
          id: string | null
          location_id: string | null
          location_name: string | null
          luggage_capacity: number | null
          make: string | null
          mileage_allowance_km: number | null
          model: string | null
          seats: number | null
          security_deposit: number | null
          transmission: string | null
          vehicle_class_id: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_class_id_fkey"
            columns: ["vehicle_class_id"]
            isOneToOne: false
            referencedRelation: "vehicle_classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
