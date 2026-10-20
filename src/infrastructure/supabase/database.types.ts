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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      coupon_stores: {
        Row: {
          coupon_id: string
          store_id: string
        }
        Insert: {
          coupon_id: string
          store_id: string
        }
        Update: {
          coupon_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_stores_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          created_at: string
          customer_coupon_id: string
          id: string
          purchase_id: string
        }
        Insert: {
          created_at?: string
          customer_coupon_id: string
          id?: string
          purchase_id: string
        }
        Update: {
          created_at?: string
          customer_coupon_id?: string
          id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_customer_coupon_id_fkey"
            columns: ["customer_coupon_id"]
            isOneToOne: false
            referencedRelation: "customer_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          activations_count: number
          audience: Database["public"]["Enums"]["coupon_audience"]
          benefit: Database["public"]["Enums"]["benefit_kind"]
          created_at: string
          description: string
          ends_at: string
          id: string
          image_path: string | null
          is_active: boolean
          max_activations: number | null
          min_total: number | null
          product_sku: string | null
          region_id: string | null
          scope: Database["public"]["Enums"]["content_scope"]
          sort_order: number
          starts_at: string
          terms: string
          title: string
          updated_at: string
          uses_per_customer: number
          valid_days_after_grant: number | null
          value: number | null
        }
        Insert: {
          activations_count?: number
          audience?: Database["public"]["Enums"]["coupon_audience"]
          benefit: Database["public"]["Enums"]["benefit_kind"]
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          max_activations?: number | null
          min_total?: number | null
          product_sku?: string | null
          region_id?: string | null
          scope?: Database["public"]["Enums"]["content_scope"]
          sort_order?: number
          starts_at?: string
          terms?: string
          title: string
          updated_at?: string
          uses_per_customer?: number
          valid_days_after_grant?: number | null
          value?: number | null
        }
        Update: {
          activations_count?: number
          audience?: Database["public"]["Enums"]["coupon_audience"]
          benefit?: Database["public"]["Enums"]["benefit_kind"]
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          max_activations?: number | null
          min_total?: number | null
          product_sku?: string | null
          region_id?: string | null
          scope?: Database["public"]["Enums"]["content_scope"]
          sort_order?: number
          starts_at?: string
          terms?: string
          title?: string
          updated_at?: string
          uses_per_customer?: number
          valid_days_after_grant?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          created_at: string
          customer_id: string
          granted: boolean
          id: string
          kind: Database["public"]["Enums"]["consent_kind"]
          version: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          granted: boolean
          id?: string
          kind: Database["public"]["Enums"]["consent_kind"]
          version?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          granted?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["consent_kind"]
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          customer_id: string
          id: string
          source: Database["public"]["Enums"]["coupon_source"]
          updated_at: string
          uses_left: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          customer_id: string
          id?: string
          source?: Database["public"]["Enums"]["coupon_source"]
          updated_at?: string
          uses_left: number
          valid_from?: string
          valid_until: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          source?: Database["public"]["Enums"]["coupon_source"]
          updated_at?: string
          uses_left?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          customer_id: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday_day: number | null
          birthday_month: number | null
          created_at: string
          first_name: string | null
          home_store_id: string | null
          id: string
          last_activity_at: string
          lifetime_points: number
          marketing_email: boolean
          marketing_push: boolean
          points_balance: number
          points_expiry_reminded_at: string | null
          status: Database["public"]["Enums"]["customer_status"]
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          birthday_day?: number | null
          birthday_month?: number | null
          created_at?: string
          first_name?: string | null
          home_store_id?: string | null
          id: string
          last_activity_at?: string
          lifetime_points?: number
          marketing_email?: boolean
          marketing_push?: boolean
          points_balance?: number
          points_expiry_reminded_at?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          birthday_day?: number | null
          birthday_month?: number | null
          created_at?: string
          first_name?: string | null
          home_store_id?: string | null
          id?: string
          last_activity_at?: string
          lifetime_points?: number
          marketing_email?: boolean
          marketing_push?: boolean
          points_balance?: number
          points_expiry_reminded_at?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_home_store_id_fkey"
            columns: ["home_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_cards: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          number: string
          status: Database["public"]["Enums"]["card_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          number: string
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          number?: string
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_stores: {
        Row: {
          offer_id: string
          store_id: string
        }
        Insert: {
          offer_id: string
          store_id: string
        }
        Update: {
          offer_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_stores_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          body: string
          coupon_id: string | null
          created_at: string
          ends_at: string
          id: string
          image_path: string | null
          is_active: boolean
          link_url: string | null
          region_id: string | null
          reward_id: string | null
          scope: Database["public"]["Enums"]["content_scope"]
          sort_order: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          coupon_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          region_id?: string | null
          reward_id?: string | null
          scope?: Database["public"]["Enums"]["content_scope"]
          sort_order?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          coupon_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          region_id?: string | null
          reward_id?: string | null
          scope?: Database["public"]["Enums"]["content_scope"]
          sort_order?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          created_at: string
          customer_id: string
          delta: number
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          note: string | null
          purchase_id: string | null
          redemption_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          delta: number
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          note?: string | null
          purchase_id?: string | null
          redemption_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          delta?: number
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          note?: string | null
          purchase_id?: string | null
          redemption_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_seen_at: string | null
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_seen_at?: string | null
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_seen_at?: string | null
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      program_settings: {
        Row: {
          birthday_coupon_id: string | null
          daily_points_cap: number
          id: boolean
          max_active_rewards: number
          max_purchase_total: number
          points_inactivity_months: number
          points_per_zloty: number
          rating_window_days: number
          reward_valid_days: number
          terms_version: string
          updated_at: string
          welcome_bonus: number
        }
        Insert: {
          birthday_coupon_id?: string | null
          daily_points_cap?: number
          id?: boolean
          max_active_rewards?: number
          max_purchase_total?: number
          points_inactivity_months?: number
          points_per_zloty?: number
          rating_window_days?: number
          reward_valid_days?: number
          terms_version?: string
          updated_at?: string
          welcome_bonus?: number
        }
        Update: {
          birthday_coupon_id?: string | null
          daily_points_cap?: number
          id?: boolean
          max_active_rewards?: number
          max_purchase_total?: number
          points_inactivity_months?: number
          points_per_zloty?: number
          rating_window_days?: number
          reward_valid_days?: number
          terms_version?: string
          updated_at?: string
          welcome_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_settings_birthday_coupon_id_fkey"
            columns: ["birthday_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          id: string
          name: string
          position: number
          product_sku: string | null
          purchase_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          position: number
          product_sku?: string | null
          purchase_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          name?: string
          position?: number
          product_sku?: string | null
          purchase_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          purchase_id: string
          rating: number
          store_id: string
          tags: Database["public"]["Enums"]["rating_tag"][]
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          purchase_id: string
          rating: number
          store_id: string
          tags?: Database["public"]["Enums"]["rating_tag"][]
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          purchase_id?: string
          rating?: number
          store_id?: string
          tags?: Database["public"]["Enums"]["rating_tag"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_ratings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_ratings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          card_id: string | null
          created_at: string
          customer_id: string | null
          discount_total: number
          id: string
          occurred_at: string
          points_earned: number
          receipt_number: string | null
          refunded_at: string | null
          store_id: string
          terminal_id: string | null
          total: number
          transaction_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          id?: string
          occurred_at?: string
          points_earned?: number
          receipt_number?: string | null
          refunded_at?: string | null
          store_id: string
          terminal_id?: string | null
          total: number
          transaction_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          id?: string
          occurred_at?: string
          points_earned?: number
          receipt_number?: string | null
          refunded_at?: string | null
          store_id?: string
          terminal_id?: string | null
          total?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_seen_at: string
          platform: Database["public"]["Enums"]["push_platform"]
          token: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_seen_at?: string
          platform: Database["public"]["Enums"]["push_platform"]
          token: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_seen_at?: string
          platform?: Database["public"]["Enums"]["push_platform"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          points_spent: number
          purchase_id: string | null
          reminded_at: string | null
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          points_spent: number
          purchase_id?: string | null
          reminded_at?: string | null
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          points_spent?: number
          purchase_id?: string | null
          reminded_at?: string | null
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          benefit: Database["public"]["Enums"]["benefit_kind"]
          created_at: string
          description: string
          id: string
          image_path: string | null
          is_active: boolean
          points_cost: number
          product_sku: string | null
          sort_order: number
          stock: number | null
          terms: string
          title: string
          updated_at: string
          valid_days: number | null
          value: number | null
        }
        Insert: {
          benefit?: Database["public"]["Enums"]["benefit_kind"]
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          points_cost: number
          product_sku?: string | null
          sort_order?: number
          stock?: number | null
          terms?: string
          title: string
          updated_at?: string
          valid_days?: number | null
          value?: number | null
        }
        Update: {
          benefit?: Database["public"]["Enums"]["benefit_kind"]
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          points_cost?: number
          product_sku?: string | null
          sort_order?: number
          stock?: number | null
          terms?: string
          title?: string
          updated_at?: string
          valid_days?: number | null
          value?: number | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          city: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          postal_code: string | null
          region_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          region_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          region_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_terms: { Args: { p_terms_version: string }; Returns: undefined }
      activate_coupon: { Args: { p_coupon_id: string }; Returns: string }
      cancel_reward_redemption: {
        Args: { p_redemption_id: string }
        Returns: undefined
      }
      complete_onboarding: {
        Args: {
          p_birthday_day?: number
          p_birthday_month?: number
          p_first_name: string
          p_home_store_id: string
          p_marketing_email?: boolean
          p_marketing_push?: boolean
          p_terms_version: string
        }
        Returns: undefined
      }
      coupons_for_store: {
        Args: { p_store_id?: string }
        Returns: {
          activations_count: number
          audience: Database["public"]["Enums"]["coupon_audience"]
          benefit: Database["public"]["Enums"]["benefit_kind"]
          created_at: string
          description: string
          ends_at: string
          id: string
          image_path: string | null
          is_active: boolean
          max_activations: number | null
          min_total: number | null
          product_sku: string | null
          region_id: string | null
          scope: Database["public"]["Enums"]["content_scope"]
          sort_order: number
          starts_at: string
          terms: string
          title: string
          updated_at: string
          uses_per_customer: number
          valid_days_after_grant: number | null
          value: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_my_account: { Args: never; Returns: undefined }
      export_my_data: { Args: never; Returns: Json }
      my_card: {
        Args: never
        Returns: {
          card_number: string
          digits: number
          period_seconds: number
          secret_hex: string
        }[]
      }
      offers_for_store: {
        Args: { p_store_id?: string }
        Returns: {
          body: string
          coupon_id: string | null
          created_at: string
          ends_at: string
          id: string
          image_path: string | null
          is_active: boolean
          link_url: string | null
          region_id: string | null
          reward_id: string | null
          scope: Database["public"]["Enums"]["content_scope"]
          sort_order: number
          starts_at: string
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pos_complete: {
        Args: {
          p_customer_coupon_ids?: string[]
          p_discount_total?: number
          p_items?: Json
          p_occurred_at?: string
          p_receipt_number?: string
          p_redemption_ids?: string[]
          p_session_id: string
          p_terminal_key: string
          p_total: number
          p_transaction_id: string
        }
        Returns: Json
      }
      pos_identify: {
        Args: { p_code: string; p_terminal_key: string }
        Returns: Json
      }
      pos_refund: {
        Args: { p_terminal_key: string; p_transaction_id: string }
        Returns: Json
      }
      rate_purchase: {
        Args: {
          p_comment?: string
          p_purchase_id: string
          p_rating: number
          p_tags?: Database["public"]["Enums"]["rating_tag"][]
        }
        Returns: undefined
      }
      redeem_reward: { Args: { p_reward_id: string }; Returns: string }
      register_push_token: {
        Args: {
          p_platform: Database["public"]["Enums"]["push_platform"]
          p_token: string
        }
        Returns: undefined
      }
      rotate_card_secret: {
        Args: never
        Returns: {
          card_number: string
          digits: number
          period_seconds: number
          secret_hex: string
        }[]
      }
      set_birthday: {
        Args: { p_day: number; p_month: number }
        Returns: undefined
      }
      unregister_push_token: { Args: { p_token: string }; Returns: undefined }
    }
    Enums: {
      benefit_kind:
        | "percent_off"
        | "amount_off"
        | "fixed_price"
        | "free_item"
        | "bonus_points"
        | "points_multiplier"
      card_status: "active" | "blocked" | "replaced"
      consent_kind: "terms" | "marketing_push" | "marketing_email"
      content_scope: "network" | "region" | "stores"
      coupon_audience: "everyone" | "personal"
      coupon_source: "activated" | "birthday" | "gift"
      customer_status: "active" | "blocked"
      ledger_kind:
        | "welcome"
        | "purchase"
        | "purchase_refund"
        | "reward"
        | "reward_refund"
        | "expiry"
        | "adjustment"
      notification_kind:
        | "welcome"
        | "points_earned"
        | "points_refunded"
        | "points_expiring"
        | "points_expired"
        | "reward_expiring"
        | "reward_expired"
        | "birthday"
        | "offer"
        | "system"
      push_platform: "ios" | "android"
      rating_tag:
        | "service"
        | "freshness"
        | "taste"
        | "cleanliness"
        | "choice"
        | "wait_time"
        | "prices"
      redemption_status: "active" | "used" | "expired" | "cancelled"
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
  public: {
    Enums: {
      benefit_kind: [
        "percent_off",
        "amount_off",
        "fixed_price",
        "free_item",
        "bonus_points",
        "points_multiplier",
      ],
      card_status: ["active", "blocked", "replaced"],
      consent_kind: ["terms", "marketing_push", "marketing_email"],
      content_scope: ["network", "region", "stores"],
      coupon_audience: ["everyone", "personal"],
      coupon_source: ["activated", "birthday", "gift"],
      customer_status: ["active", "blocked"],
      ledger_kind: [
        "welcome",
        "purchase",
        "purchase_refund",
        "reward",
        "reward_refund",
        "expiry",
        "adjustment",
      ],
      notification_kind: [
        "welcome",
        "points_earned",
        "points_refunded",
        "points_expiring",
        "points_expired",
        "reward_expiring",
        "reward_expired",
        "birthday",
        "offer",
        "system",
      ],
      push_platform: ["ios", "android"],
      rating_tag: [
        "service",
        "freshness",
        "taste",
        "cleanliness",
        "choice",
        "wait_time",
        "prices",
      ],
      redemption_status: ["active", "used", "expired", "cancelled"],
    },
  },
} as const
