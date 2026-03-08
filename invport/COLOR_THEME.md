# Color Theme System

This document describes the color palette and theme system used throughout the application.

## Color Palette

All colors are defined in `tailwind.config.js` under the `theme.colors.theme` object.

### Primary Colors

| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Primary Dark | `#1e1e24` | Sidebar, navbar, header, primary dark elements | `bg-theme-primary-dark`, `text-theme-primary-dark` |
| Content Background | `#ffcf99` | Main content area background | `bg-theme-content-bg` |
| Content White | `#FFFFFF` | Content sections, cards, panels | `bg-theme-content-white`, `text-theme-content-white` |
| Secondary | `#92140c` | Buttons, active states, important elements | `bg-theme-secondary`, `text-theme-secondary` |
| Light Cream | `#fff8f0` | Light backgrounds, subtle sections | `bg-theme-light-cream` |
| Navy | `#111d4a` | Secondary buttons, subtle accents | `bg-theme-navy` |
| Text Dark | `#1e1e24` | Primary text color | `text-theme-text-dark` |

## Color Usage by Component

### Layout Components

#### Sidebar (`Sidebar.tsx`)
- **Background**: `bg-theme-primary-dark` (#1e1e24)
- **Active Navigation Item**: `bg-theme-secondary` (#92140c)
- **Sub-item Active**: `bg-theme-navy` (#111d4a)
- **Hover State**: `hover:bg-red-700`
- **Toggle Button**: `bg-theme-navy` with `hover:bg-theme-secondary`
- **Footer Icon**: `bg-theme-secondary`

#### Header (`Header.tsx`)
- **Background**: `bg-theme-primary-dark` (#1e1e24)
- **Sign Out Button**: `bg-theme-secondary` (#92140c) with `hover:bg-red-700`

#### Main Content Area (`Layout.tsx`)
- **Outer Container**: `bg-theme-primary-dark` (#1e1e24) - visible as border around app
- **Content Background**: `bg-theme-content-bg` (#ffcf99)
- **Content Sections**: Should use `bg-theme-content-white` (#FFFFFF)

## How to Change Colors

### Method 1: Update Tailwind Config (Recommended)

Edit `tailwind.config.js` and change the hex values in the `theme.colors.theme` object:

```javascript
theme: {
  'primary-dark': '#YOUR_HEX_HERE',
  'content-bg': '#YOUR_HEX_HERE',
  // ... etc
}
```

### Method 2: Use Theme Classes in Components

When building new components, use the theme classes:

```jsx
// Buttons
<button className="bg-theme-secondary hover:bg-red-700 text-white">
  Primary Action
</button>

// Cards/Sections
<div className="bg-theme-content-white rounded-lg shadow-md p-4">
  Content here
</div>

// Background areas
<div className="bg-theme-content-bg">
  Page content
</div>
```

## Color Scheme Summary

The application uses a **warm, professional color scheme**:
- **Dark sidebar/navigation** (#1e1e24) for contrast and focus
- **Warm peach content background** (#ffcf99) for a welcoming feel
- **Clean white content sections** (#FFFFFF) for readability
- **Deep red accents** (#92140c) for important actions and active states
- **Navy blue** (#111d4a) for secondary elements

## Future Updates

To change the entire theme:
1. Update the hex values in `tailwind.config.js`
2. Run `npm run dev` to rebuild Tailwind
3. All components will automatically use the new colors

## Component-Specific Color Overrides

If you need to override colors for specific components without changing the theme:

```jsx
// Instead of theme class
className="bg-theme-secondary"

// Use direct color
className="bg-[#YOUR_HEX]"
```

Note: Theme classes are preferred for consistency and easy theme switching.
