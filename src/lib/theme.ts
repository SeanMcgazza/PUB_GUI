/**
 * White-label theme system.
 *
 * Each pub can store a `theme_config` JSON in `pubs.settings.theme` (or its
 * own column once schema is migrated). This module reads that config and
 * produces a `style={...}` object that overrides the global design tokens
 * for a single subtree.
 *
 * Code MUST always reference `var(--theme-...)` — never hard-code colors.
 * That way, dropping in this <ThemeProvider style={...}> on any subtree
 * re-skins it without component changes.
 */

import type { CSSProperties } from 'react';

export interface ThemeConfig {
  /** Brand color used for CTAs, active states. Default: copper gold. */
  primary_color?: string;
  /** Lighter brand color for hover/glow. Default: F59E0B. */
  primary_glow?: string;
  /** Deeper brand color for pressed states. Default: B45309. */
  primary_deep?: string;

  /** Card surface. Default: glass gray (#1C1F26). */
  surface_card?: string;
  /** Page surface. Default: rich charcoal (#0F1115). */
  surface_base?: string;

  /** Heading font (loaded via next/font in layout.tsx). Default: Lora. */
  heading_font?: 'Lora' | 'Playfair Display' | 'Inter';
  /** Body font. Default: Inter. */
  body_font?: 'Inter' | 'Montserrat';

  /** Corner radius style. */
  border_style?: 'rounded' | 'square' | 'pill';

  /** Whether to apply backdrop-filter glass effects on headers/sheets. */
  glassmorphism?: boolean;

  /** Layout density on the customer menu page. */
  layout_mode?: 'grid' | 'list';
}

/**
 * Convert a ThemeConfig into a CSSProperties object that overrides the
 * `--theme-*` CSS variables on a wrapper element.
 *
 * Usage:
 *   <div style={themeStyleFromConfig(pub.settings?.theme)}>...</div>
 */
export function themeStyleFromConfig(
  config: ThemeConfig | null | undefined
): CSSProperties {
  if (!config) return {};

  // CSSProperties doesn't have `--*` typed keys; fall through `as` cast.
  const style: Record<string, string | number> = {};

  if (config.primary_color) style['--theme-primary'] = config.primary_color;
  if (config.primary_glow) style['--theme-primary-glow'] = config.primary_glow;
  if (config.primary_deep) style['--theme-primary-deep'] = config.primary_deep;
  if (config.surface_card) style['--theme-surface-card'] = config.surface_card;
  if (config.surface_base) style['--theme-surface-base'] = config.surface_base;

  if (config.border_style === 'square') style['--theme-radius'] = '0.25rem';
  if (config.border_style === 'pill') style['--theme-radius'] = '9999px';

  return style as CSSProperties;
}

/** Default theme. Mirrors the :root values in globals.css. */
export const DEFAULT_THEME: ThemeConfig = {
  primary_color: '#D97706',
  primary_glow: '#F59E0B',
  primary_deep: '#B45309',
  surface_card: '#1C1F26',
  surface_base: '#0F1115',
  heading_font: 'Lora',
  body_font: 'Inter',
  border_style: 'rounded',
  glassmorphism: true,
  layout_mode: 'grid',
};
