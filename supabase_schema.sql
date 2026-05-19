-- ========================================================
-- VYAPARK - DATABASE SCHEMA (PostgreSQL)
-- Copy and run this script in the Supabase SQL Editor
-- ========================================================

-- 1. PROFILES TABLE (Stores buyers, sellers, and admin profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  shop_name text,
  phone text,
  role text DEFAULT 'buyer', -- 'buyer', 'seller', 'admin'
  is_verified boolean DEFAULT false, -- Golden Badge for verified sellers
  location_lat numeric,
  location_lng numeric,
  delivery_radius numeric DEFAULT 5, -- in kilometers
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null
);

-- 2. PRODUCTS TABLE (Stores products added by sellers)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT null,
  price numeric NOT null,
  mrp numeric NOT null,
  image_url text,
  category text,
  stock integer DEFAULT 10,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_approved boolean DEFAULT false, -- Admin must approve products before they go live
  cod_available boolean DEFAULT true,
  same_day_delivery boolean DEFAULT true,
  return_policy boolean DEFAULT false,
  warranty_policy boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null
);

-- 3. SERVICES TABLE (Stores services added by sellers)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT null,
  price numeric NOT null,
  image_url text,
  category text,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_approved boolean DEFAULT false, -- Admin must approve services before they go live
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null
);

-- 4. MESSAGES TABLE (Real-time Chat messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users ON DELETE CASCADE,
  content text NOT null,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null
);

-- 5. Disable Row Level Security (RLS) for testing and rapid prototyping
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 6. ORDERS TABLE (Stores transactions and commission tracking)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  total_amount numeric NOT null,
  commission_amount numeric NOT null, -- Vyapark's cut
  gst_amount numeric NOT null,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  payment_method text DEFAULT 'cod',
  delivery_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null
);

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
