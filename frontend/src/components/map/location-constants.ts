import { MapPin, AlertTriangle, TreePine, Eye, Shield, Crosshair, Home } from 'lucide-react';

export const LOCATION_TYPE_ICONS: Record<string, typeof MapPin> = {
  town: Home,
  dungeon: AlertTriangle,
  wilderness: TreePine,
  ruin: Eye,
  sanctuary: Shield,
  crossroad: Crosshair,
};

export const LOCATION_TYPE_COLORS: Record<string, string> = {
  town: 'text-amber-400',
  dungeon: 'text-red-400',
  wilderness: 'text-green-400',
  ruin: 'text-stone-400',
  sanctuary: 'text-blue-400',
  crossroad: 'text-yellow-400',
};

export const LOCATION_TYPE_BG: Record<string, string> = {
  town: 'bg-amber-900/30 border-amber-700/50',
  dungeon: 'bg-red-900/30 border-red-700/50',
  wilderness: 'bg-green-900/30 border-green-700/50',
  ruin: 'bg-stone-800/50 border-stone-600/50',
  sanctuary: 'bg-blue-900/30 border-blue-700/50',
  crossroad: 'bg-yellow-900/30 border-yellow-700/50',
};

export const LOCATION_STATUS_BADGES: Record<string, { labelKey: string; className: string }> = {
  undiscovered: { labelKey: 'undiscovered', className: 'bg-stone-700 text-stone-400' },
  known: { labelKey: 'known', className: 'bg-blue-900/50 text-blue-300' },
  visited: { labelKey: 'visited', className: 'bg-green-900/50 text-green-300' },
  cleared: { labelKey: 'cleared', className: 'bg-amber-900/50 text-amber-300' },
};
