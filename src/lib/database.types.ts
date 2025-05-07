export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          phone: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      destinations: {
        Row: {
          id: string
          name: string
          description: string
          short_description: string | null
          category_id: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          short_description?: string | null
          category_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          short_description?: string | null
          category_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      destination_images: {
        Row: {
          id: string
          destination_id: string
          image_url: string
          alt_text: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          destination_id: string
          image_url: string
          alt_text?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          destination_id?: string
          image_url?: string
          alt_text?: string | null
          is_primary?: boolean
          created_at?: string
        }
      }
      service_providers: {
        Row: {
          id: string
          profile_id: string
          company_name: string
          description: string | null
          address: string | null
          logo_url: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          company_name: string
          description?: string | null
          address?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          company_name?: string
          description?: string | null
          address?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          provider_id: string
          name: string
          description: string
          type: string
          price: number
          price_unit: string
          duration: string | null
          max_capacity: number | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          name: string
          description: string
          type: string
          price: number
          price_unit?: string
          duration?: string | null
          max_capacity?: number | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          name?: string
          description?: string
          type?: string
          price?: number
          price_unit?: string
          duration?: string | null
          max_capacity?: number | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_images: {
        Row: {
          id: string
          service_id: string
          image_url: string
          alt_text: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          image_url: string
          alt_text?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          image_url?: string
          alt_text?: string | null
          is_primary?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          service_id: string
          booking_number: string
          status: string
          booking_date: string
          start_date: string
          end_date: string | null
          quantity: number
          total_price: number
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          booking_number: string
          status?: string
          booking_date: string
          start_date: string
          end_date?: string | null
          quantity?: number
          total_price: number
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          booking_number?: string
          status?: string
          booking_date?: string
          start_date?: string
          end_date?: string | null
          quantity?: number
          total_price?: number
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          currency: string
          payment_method: string | null
          status: string
          xendit_invoice_id: string | null
          xendit_payment_id: string | null
          payment_link: string | null
          expiry_date: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          currency?: string
          payment_method?: string | null
          status?: string
          xendit_invoice_id?: string | null
          xendit_payment_id?: string | null
          payment_link?: string | null
          expiry_date?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          currency?: string
          payment_method?: string | null
          status?: string
          xendit_invoice_id?: string | null
          xendit_payment_id?: string | null
          payment_link?: string | null
          expiry_date?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          destination_id: string | null
          service_id: string | null
          booking_id: string | null
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_id?: string | null
          service_id?: string | null
          booking_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_id?: string | null
          service_id?: string | null
          booking_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          destination_id: string | null
          service_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_id?: string | null
          service_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_id?: string | null
          service_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}