// CMS Type Definitions for LNG79 Content Management System

export interface ArticleItem {
  id: string;
  title: { vi: string; en: string };
  excerpt: { vi: string; en: string };
  content: { vi: string; en: string };
  category: string;
  date: string;
  image: string;
  images?: string[];
  visible?: boolean;
  sortOrder?: number;
}

export interface ProjectItem {
  id: string;
  name: { vi: string; en: string };
  category: 'lng' | 'lpg' | 'conversion' | 'kitchen';
  location: { vi: string; en: string };
  scope: { vi: string; en: string };
  capacity: { vi: string; en: string };
  result: { vi: string; en: string };
  equipments: string[];
  image: string;
  images?: string[];
  visible?: boolean;
  sortOrder?: number;
}

export interface ProductItem {
  id: string;
  name: { vi: string; en: string };
  category: 'lng' | 'lpg' | 'burner' | 'kitchen';
  desc: { vi: string; en: string };
  specs: { vi: string; en: string }[];
  image: string;
  images?: string[];
  price?: string;
  visible?: boolean;
  sortOrder?: number;
}

export interface PageBlock {
  id: string;
  type: string;
  title?: { vi: string; en: string };
  content?: { vi: string; en: string };
  image?: string;
  logos?: string[];
  [key: string]: any;
}
