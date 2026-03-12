import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarRange,
  FileSpreadsheet,
  Globe2,
  Handshake,
  LayoutDashboard,
  MapPinned,
  MessagesSquare,
  QrCode,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users2,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  badge: BadgeCheck,
  chart: BarChart3,
  building: Building2,
  calendar: CalendarRange,
  file: FileSpreadsheet,
  globe: Globe2,
  handshake: Handshake,
  layout: LayoutDashboard,
  map: MapPinned,
  message: MessagesSquare,
  qr: QrCode,
  shield: ShieldCheck,
  sparkles: Sparkles,
  ticket: Ticket,
  users: Users2,
};

export function resolveIcon(iconKey?: string): LucideIcon {
  if (!iconKey) {
    return BadgeCheck;
  }

  return iconMap[iconKey] || BadgeCheck;
}
