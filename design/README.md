# Arrow Maze Mobile Design Source

This folder contains product design references for the mobile client.

It is intentionally inside `arrow-maze-client/` because these assets and mockups belong to the mobile frontend.

## Folder role

- `design/`: source references, mockups, logos, exported design artifacts, and visual guidelines.
- `src/assets/`: runtime assets imported by the Expo app.
- `public/`: web-only static assets if a future Expo web export needs files served by URL.

Do not import files from `design/` in domain or application code. When a production screen needs an image, copy or export the finalized runtime asset into `src/assets/` and import it from presentation/framework code.

## Principal UI Palette

| Use | Color | Hex |
| --- | --- | --- |
| Primary Blue | Main violet-blue | `#5262FB` |
| Primary Blue Light | Bright blue for gradients | `#7985FF` |
| Secondary Lavender | Medium lavender | `#9DA6FB` |
| Soft Lavender | Soft card background | `#E9EBFA` |
| Surface White | Cards / inputs | `#FFFFFF` |
| Dark Text | Main text | `#0F0F0F` |

## Extended Palette

| Use | Color | Hex |
| --- | --- | --- |
| Primary 900 | Deep blue | `#3744D9` |
| Primary 700 | Strong blue | `#5262FB` |
| Primary 500 | Vibrant blue | `#6B78FF` |
| Primary 300 | Lavender blue | `#9DA6FB` |
| Primary 100 | Very light blue | `#DDE2FF` |
| Background | General background | `#F4F5FF` |
| Card Background | Soft cards | `#E9EBFA` |
| Border Soft | Subtle borders | `#D6DAF5` |
| Text Primary | Strong text | `#0F0F0F` |
| Text Secondary | Blue-gray text | `#6B6F8A` |
| Text Muted | Soft text | `#A1A6C3` |
| Success / Money | Money green | `#56D879` |
| Coin Gold | Main gold | `#FFC83D` |
| Coin Orange | Gold shadow | `#F6A700` |

## Tailwind / NativeWind Tokens

These colors are configured in `tailwind.config.js`:

```js
colors: {
  primary: {
    900: "#3744D9",
    700: "#5262FB",
    500: "#6B78FF",
    300: "#9DA6FB",
    100: "#DDE2FF",
  },
  background: {
    DEFAULT: "#F4F5FF",
    soft: "#E9EBFA",
    card: "#FFFFFF",
  },
  text: {
    primary: "#0F0F0F",
    secondary: "#6B6F8A",
    muted: "#A1A6C3",
    inverse: "#FFFFFF",
  },
  border: {
    soft: "#D6DAF5",
  },
  reward: {
    gold: "#FFC83D",
    orange: "#F6A700",
    green: "#56D879",
  },
}
```

## Key Gradients

Main blue background:

```css
linear-gradient(135deg, #5262FB 0%, #7985FF 100%)
```

Reward card:

```css
linear-gradient(135deg, #7985FF 0%, #5262FB 100%)
```

Glass lavender card:

```css
linear-gradient(135deg, rgba(255,255,255,0.35), rgba(157,166,251,0.25))
```

Primary button:

```css
linear-gradient(135deg, #5262FB 0%, #6B78FF 100%)
```

Coin / reward accent:

```css
linear-gradient(135deg, #FFD966 0%, #FFC83D 45%, #F6A700 100%)
```

## Usage Guidance

- Use `#5262FB` for primary buttons, active navigation, and active icons.
- Use `#E9EBFA` and `#F4F5FF` for general backgrounds.
- Use `#FFFFFF` for floating cards.
- Use `#FFC83D` only for rewards, coins, achievements, and points.
- Use `#0F0F0F` for titles and `#6B6F8A` for secondary text.

