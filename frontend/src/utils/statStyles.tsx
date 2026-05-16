import React from 'react';
import { Hash, Type, Gauge, Tags } from 'lucide-react';
import type { ResourceTemplate } from '../types/entities';

export const typeColors: Record<ResourceTemplate['type'], string> = {
  number: 'border-l-blue-400',
  text: 'border-l-green-400',
  progress: 'border-l-amber-400',
  enum: 'border-l-purple-400',
  pool: 'border-l-red-400',
  object: 'border-l-cyan-400',
};

export const typeIcons: Record<ResourceTemplate['type'], (size?: number) => React.ReactNode> = {
  number: (s = 14) => <Hash size={s} className="text-blue-400" />,
  text: (s = 14) => <Type size={s} className="text-green-400" />,
  progress: (s = 14) => <Gauge size={s} className="text-amber-400" />,
  enum: (s = 14) => <Tags size={s} className="text-purple-400" />,
  pool: (s = 14) => <Gauge size={s} className="text-red-400" />,
  object: (s = 14) => <Hash size={s} className="text-cyan-400" />,
};

export const typeLabelColors: Record<ResourceTemplate['type'], string> = {
  number: 'text-blue-400',
  text: 'text-green-400',
  progress: 'text-amber-400',
  enum: 'text-purple-400',
  pool: 'text-red-400',
  object: 'text-cyan-400',
};
