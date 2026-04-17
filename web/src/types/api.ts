export interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  opening_hours: string | null;
  is_active: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  text_color: string;
  emoji: string | null;
  tenant_id: number;
}

export interface Category {
  id: number;
  name: string;
  emoji: string | null;
  order: number;
  tenant_id: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_id: number;
  tenant_id: number;
  tags: Tag[];
}

export interface PublicMenu {
  tenant: Tenant;
  categories: Category[];
  items: MenuItem[];
}

export interface User {
  id: number;
  email: string;
  role: "super_admin" | "restaurant_admin";
  tenant_id: number | null;
}
