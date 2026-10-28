---
name: "AMA Lipa BagGuard"
description: "A student bag registration and campus gate verification system for AMA Computer College – Lipa Campus."
colors:
  background: "oklch(0.978 0.01 246)"
  foreground: "oklch(0.24 0.045 255)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.24 0.045 255)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.24 0.045 255)"
  primary: "oklch(0.31 0.075 255)"
  primary-foreground: "oklch(0.99 0.004 250)"
  secondary: "oklch(0.39 0.11 20)"
  secondary-foreground: "oklch(0.99 0.004 250)"
  muted: "oklch(0.95 0.012 250)"
  muted-foreground: "oklch(0.45 0.03 255)"
  accent: "oklch(0.84 0.14 78)"
  accent-foreground: "oklch(0.28 0.06 255)"
  destructive: "oklch(0.49 0.19 25)"
  border: "oklch(0.89 0.018 250)"
  input: "oklch(0.89 0.018 250)"
  ring: "oklch(0.56 0.09 255)"
  sidebar-ring: "oklch(0.84 0.14 78)"
  sidebar-border: "oklch(0.42 0.06 255)"
  sidebar-accent-foreground: "oklch(0.99 0.004 250)"
  sidebar-accent: "oklch(0.38 0.07 255)"
  sidebar-primary-foreground: "oklch(0.28 0.06 255)"
  sidebar-primary: "oklch(0.84 0.14 78)"
typography:
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
rounded:
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "0.625rem"
  xl: "calc(var(--radius) * 1.4)"
  2xl: "calc(var(--radius) * 1.8)"
  3xl: "calc(var(--radius) * 2.2)"
  4xl: "calc(var(--radius) * 2.6)"
---

<!-- Generated from .project/DESIGN_SYSTEM.md + app/globals.css by the engine. Tokens above are normative and mirror the CSS; edit the CSS and DESIGN_SYSTEM.md, not this file. -->

## Overview

Campus gatehouse ledger: a navy checkpoint masthead, white record sheets, maroon action marks, and gold review flags.

## Colors

| Token | Value |
| background | `oklch(0.978 0.01 246)` |
| surface | `oklch(1 0 0)` |
| text / muted | `oklch(0.24 0.045 255)` / `oklch(0.49 0.028 255)` |
| border | `oklch(0.89 0.018 250)` |
| primary | `oklch(0.31 0.075 255)` campus navy |
| secondary | `oklch(0.42 0.12 20)` maroon |
| accent | `oklch(0.84 0.14 78)` gold |
| success / warning / danger | `oklch(0.48 0.13 150)` / gold accent / `oklch(0.49 0.19 25)` |

Declared in `globals.css` as `--color-*` and mirrored in the frontmatter. Use the token, never a raw hex.

## Typography

- Headings and body: locally served IBM Plex Sans Variable, compact bold hierarchy
- Records and identifiers: system monospace with tabular numerals

- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

## Layout

- Radius / shadow / spacing rhythm: 10px control corners, 12–16px cards, hairline borders, compact record rows, generous page gutters.
- Shared components: shadcn Button, Input, Textarea, Select, StatusBadge, AppShell, registration tables.
- Motion: short ease-out transitions, restrained page entrance, and reduced-motion support.

## Shapes

Radii: `sm` calc(var(--radius) * 0.6), `md` calc(var(--radius) * 0.8), `lg` 0.625rem, `xl` calc(var(--radius) * 1.4), `2xl` calc(var(--radius) * 1.8), `3xl` calc(var(--radius) * 2.2), `4xl` calc(var(--radius) * 2.6)

## Do's and Don'ts

- Voice: Plain, procedural, and respectful; state the registration decision clearly without implying a lookup alone authorizes entry.

- Do load faces through Fontsource, not `next/font/google`.
- Don't introduce a colour or radius that isn't a token above.
- Don't use gradient text, or a purple/violet gradient as the brand signal.
- Don't use bounce or elastic easing; real objects decelerate smoothly.
