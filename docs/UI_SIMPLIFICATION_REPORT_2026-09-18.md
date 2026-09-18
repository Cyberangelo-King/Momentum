# Momentum UI Simplification Report

Date: 2026-09-18

## Objective

I simplified the visual language of Momentum across the application without removing product functionality.

The current UI had accumulated heavy visual treatment across cards, navigation, controls, modals, shadows, glow effects, rounded containers, and animated feedback. The goal was to make the product feel calmer, faster, and easier to scan.

## Changes

### Global UI reset
- Added a `ui-simple` application shell class.
- Standardized corner radii across cards, controls, and modals.
- Removed decorative shadows and text shadows from the simplified surface.
- Reduced reliance on backdrop blur.
- Flattened excessive background treatments.
- Reduced visual amplification from scale animations and glow effects.
- Standardized border treatment.
- Tightened typography hierarchy.
- Kept focus states and accessibility behavior intact.

### Desktop
- Reduced the navigation rail from 256px to 220px.
- Reduced sidebar padding and control density.
- Reduced main content chrome and unnecessary whitespace.
- Preserved every existing navigation and utility action.

### Mobile
- Reduced top app bar height.
- Reduced bottom navigation height.
- Removed unnecessary blur treatment.
- Tightened main viewport spacing.

### Modals and forms
- Simplified modal presentation.
- Standardized form control radii.
- Removed visual spectacle while preserving interaction and state.

## Product principle

Momentum should feel like a tool for capturing and converting relationships, not a dashboard competing for attention.

The simplification is intentionally structural at the visual-system level first. Functionality remains intact.

## Files changed

- `src/index.css`
- `src/App.tsx`

## Commits

- `48fb410962f8302dd38ed79edab9a6ace51e2dbe` — simplify visual system across Momentum
- `e4b7ff3fe109fe38178be1c1d0a630e1564554f4` — enable simplified application shell

## Next UI pass

The next pass should focus on information architecture rather than styling alone:
1. Reduce desktop navigation choices into primary vs secondary actions.
2. Audit each screen for duplicated controls and competing CTAs.
3. Simplify the More/feature area.
4. Reduce modal count where a direct screen interaction can replace it.
5. Establish one canonical card, button, badge, and modal pattern.
6. Validate mobile first, then desktop.

No product capability was intentionally removed in this pass.
