# Mind Block Design Token System

The Mind Block design token system centralizes colors, typography, spacing, border radii, shadows, glows, gradients, transitions, and z-index values to ensure visual consistency across the Web3 gaming app.

---

## 🎨 Core Colors

| CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--mb-electric-blue` | `#3B82F6` | Primary actions, links, focus rings |
| `--mb-neon-purple` | `#8B5CF6` | Secondary accents, badges, brand gradients |
| `--mb-vibrant-teal` | `#14B8A6` | Success indicators, highlights, Web3 accents |

---

## 🌓 Theme Tokens

Theme tokens automatically adapt when switching between Dark mode (default) and Light mode via `[data-theme='dark']` or `[data-theme='light']`.

### Backgrounds & Surfaces
- `--mb-bg-primary`: Main app background (`#0B0F19` dark / `#F8FAFC` light)
- `--mb-bg-secondary`: Secondary section background
- `--mb-bg-surface`: Component surface background
- `--mb-bg-glass`: Translucent glassmorphism background (`rgba(...)` with blur)
- `--mb-bg-card`: Card container surface

### Text Colors
- `--mb-text-primary`: Primary headings & body text (`#F8FAFC` dark / `#0F172A` light)
- `--mb-text-secondary`: Secondary labels & subtitles
- `--mb-text-muted`: Helper text & disabled labels
- `--mb-text-accent`: Highlight text

---

## ✨ Glows & Gradients

- `--mb-glow-blue`: `0 0 20px rgba(59, 130, 246, 0.5)`
- `--mb-glow-purple`: `0 0 20px rgba(139, 92, 246, 0.5)`
- `--mb-glow-teal`: `0 0 20px rgba(20, 184, 166, 0.5)`
- `--mb-gradient-primary`: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)`
- `--mb-gradient-accent`: `linear-gradient(135deg, #8B5CF6 0%, #14B8A6 100%)`

---

## 📐 Spacing & Radius

- **Spacing Scale**: `--mb-space-1` (4px) through `--mb-space-12` (48px)
- **Border Radius**: `--mb-radius-sm` (4px), `--mb-radius-md` (8px), `--mb-radius-lg` (12px), `--mb-radius-xl` (16px), `--mb-radius-full` (9999px)

---

## 🚀 How to Use in Components

### CSS / Utility Classes
```css
.card {
  background: var(--mb-bg-glass);
  border: 1px solid var(--mb-border-subtle);
  border-radius: var(--mb-radius-lg);
  box-shadow: var(--mb-glow-purple);
}
```

### Tailwind Classes
```tsx
<div className="bg-mb-bg-glass border border-mb-border-subtle rounded-mb-lg shadow-mb-glow-purple">
  <h2 className="text-transparent bg-clip-text bg-mb-gradient-primary">
    Mind Block Game
  </h2>
</div>
```
