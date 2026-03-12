import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  to: string;
  children?: {
    label: string;
    to: string;
  }[];
};

export type Stat = {
  label: string;
  value: string;
  detail: string;
};

export type ValueCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ServiceCard = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

export type PortfolioEntry = {
  slug: string;
  category: string;
  tags: string[];
  title: string;
  description: string;
  outcome: string;
  client: string;
  period: string;
  scope: string[];
  summary: string;
  challenge: string;
  approach: string;
  result: string;
  galleryPlaceholders: string[];
};

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type ResourceCategory = {
  title: string;
  description: string;
};

export type NoticeItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
};

export type ResourceItem = {
  slug: string;
  title: string;
  type: string;
  description: string;
  details: string[];
};
