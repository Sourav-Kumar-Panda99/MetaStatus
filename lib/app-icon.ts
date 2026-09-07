import {
  Smartphone,
  Rocket,
  Gamepad2,
  ShoppingBag,
  Camera,
  MessageCircle,
  Music,
  Wallet,
  MapPin,
  Heart,
  Compass,
  Zap,
  type LucideIcon,
} from "lucide-react";

// A varied but fixed palette of flat tile colors (no gradients).
const TILE_COLORS = [
  "#1877F2", // blue
  "#31A24C", // green
  "#F7B928", // yellow
  "#8B5CF6", // purple
  "#F0246A", // pink
  "#0F9B8E", // teal
  "#F2760B", // orange
  "#5B6EF5", // indigo
];

const ICONS: LucideIcon[] = [
  Smartphone,
  Rocket,
  Gamepad2,
  ShoppingBag,
  Camera,
  MessageCircle,
  Music,
  Wallet,
  MapPin,
  Heart,
  Compass,
  Zap,
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAppIcon(nameOrId: string): {
  Icon: LucideIcon;
  color: string;
} {
  const hash = hashString(nameOrId);
  const Icon = ICONS[hash % ICONS.length];
  const color = TILE_COLORS[hash % TILE_COLORS.length];
  return { Icon, color };
}
