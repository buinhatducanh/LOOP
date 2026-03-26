// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { TeamMember } from "./team";

export type Service = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  startingPrice: number;
  deliveryTime: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  projects: Project[];
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: string;
  image: string;
  description: string;
  techStack: string[];
  features: string[];
  results: string;
  screenshots: string[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  serviceId: string | null;
  service: Service | null;
  teamMemberId: string | null;
  teamMember: TeamMember | null;
};

export type PricingPlan = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  period: string;
  tagline: string;
  features: string[];
  notIncluded: string[];
  highlighted: boolean;
  cta: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
