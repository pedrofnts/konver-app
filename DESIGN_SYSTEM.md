# Konver AI Design System

## Overview

The Konver AI Design System provides a comprehensive set of design tokens, components, and guidelines for building consistent, accessible, and beautiful user interfaces for the AI assistant platform. The system balances professionalism with approachability, using warm and welcoming colors while maintaining a modern, innovative feel.

## Design Principles

### 1. **User-Centered Design**
- Prioritize user needs and accessibility
- Clear visual hierarchy and information architecture
- Consistent patterns and predictable interactions

### 2. **Professional Yet Approachable**
- Balance between corporate professionalism and human warmth
- Use appropriate contrast and typography for readability
- Incorporate subtle animations and micro-interactions

### 3. **Modern Innovation**
- Contemporary design language with subtle visual enhancements
- Progressive disclosure for complex features
- Mobile-first responsive design

### 4. **Trustworthy AI**
- Visual cues that inspire confidence in AI capabilities
- Clear status indicators and feedback mechanisms
- Transparent data handling and processing states

## Color Palette

### Primary Colors
- **Primary Blue**: `#4267f5` - Main brand color for CTAs and key elements
- **Accent Cyan**: `#0ea5e9` - Secondary actions and highlights
- **Background**: `#f7f8fb` - Soft, comfortable main background
- **Foreground**: `#252834` - Rich, readable text color

### Surface Colors
- **Card**: `#fdfeff` - Pure white for content containers
- **Elevation 1**: `#fafbfc` - Subtle elevation for interactive elements
- **Elevation 2**: `#f5f6f9` - Higher elevation for floating elements
- **Elevation 3**: `#f0f2f7` - Maximum elevation for modals and overlays

### Semantic Colors
- **Success**: `#16a34a` - Success states and positive feedback
- **Warning**: `#f59e0b` - Warning states and attention needed
- **Error**: `#ef4444` - Error states and destructive actions
- **Info**: Uses accent cyan for informational content

### Neutral Colors
- **Muted**: `#eaecf2` - Subtle backgrounds and disabled states
- **Muted Foreground**: `#6b7280` - Secondary text and placeholders
- **Border**: `#dee2ea` - Soft borders and dividers

## Typography

### Font Stack
- **Primary**: Inter (Google Fonts) - Modern, highly readable sans-serif
- **Monospace**: JetBrains Mono - Code blocks and technical content

### Type Scale
- **H1**: 3xl-4xl, bold, tight tracking - Page titles
- **H2**: 2xl-3xl, semibold, tight tracking - Section headers
- **H3**: xl-2xl, semibold, tight tracking - Subsection headers
- **H4**: lg-xl, medium - Card titles and important labels
- **H5**: base-lg, medium - Secondary headers
- **H6**: sm-base, medium - Tertiary headers and labels
- **Body**: base, normal - Main content text
- **Small**: sm, normal - Captions and minor text

### Line Heights
- **Tight**: 1.2 - Large headings
- **Snug**: 1.3-1.4 - Medium headings
- **Normal**: 1.5 - Labels and UI text
- **Relaxed**: 1.6 - Body content for readability

## Spacing System

Uses a consistent 4px base unit with common spacing values:

- **xs**: 2px (0.5rem)
- **sm**: 4px (1rem)
- **md**: 8px (2rem)
- **lg**: 12px (3rem)
- **xl**: 16px (4rem)
- **2xl**: 20px (5rem)
- **3xl**: 24px (6rem)

### Additional Spacing
- **18**: 4.5rem - Custom spacing for specific layouts
- **22**: 5.5rem - Card padding and component spacing
- **26**: 6.5rem - Section spacing
- **30**: 7.5rem - Large section breaks

## Border Radius

- **Small**: 8px - Buttons, inputs, small elements
- **Default**: 12px - Cards, containers, medium elements
- **Large**: 16px - Large containers, modals
- **Extra Large**: 20px - Hero sections, major containers

## Shadows

### Elevation System
- **Small**: Subtle shadow for slight elevation
- **Medium**: Standard shadow for cards and containers
- **Large**: Prominent shadow for floating elements
- **Extra Large**: Maximum shadow for modals and overlays

## Components

### Buttons

#### Primary Button (`.konver-button-primary`)
- **Use**: Primary actions, CTAs
- **Style**: Gradient background, white text, medium shadow
- **States**: Hover lifts with increased shadow

#### Secondary Button (`.konver-button-secondary`)
- **Use**: Secondary actions
- **Style**: Light gray background, dark text
- **States**: Hover darkens background

#### Accent Button (`.konver-button-accent`)
- **Use**: Special features, premium actions
- **Style**: Cyan gradient, white text
- **States**: Hover reduces opacity

#### Ghost Button (`.konver-button-ghost`)
- **Use**: Tertiary actions, navigation
- **Style**: Transparent background, border on hover
- **States**: Hover shows background and border

### Cards

#### Basic Card (`.konver-card`)
- **Use**: Content containers
- **Style**: White background, subtle border, small shadow
- **Features**: Rounded corners, comfortable padding

#### Interactive Card (`.konver-card-interactive`)
- **Use**: Clickable content blocks
- **Style**: Extends basic card with hover states
- **Features**: Lift animation, pointer cursor

#### Feature Card (`.konver-card-feature`)
- **Use**: Highlighted content, featured items
- **Style**: Gradient background, medium shadow
- **Features**: Enhanced visual prominence

### Status Indicators

#### Success (`.konver-status-success`)
- **Color**: Green with light background
- **Use**: Completed actions, positive states

#### Warning (`.konver-status-warning`)
- **Color**: Orange with light background
- **Use**: Attention needed, non-critical issues

#### Error (`.konver-status-error`)
- **Color**: Red with light background
- **Use**: Failed actions, critical issues

#### Info (`.konver-status-info`)
- **Color**: Cyan with light background
- **Use**: Informational content, tips

## Interactions and Animations

### Hover States
- **Lift Effect**: Elements translate up 1px with increased shadow
- **Duration**: 200ms with ease-out timing
- **Scale**: Slight border color change to primary/accent

### Focus States
- **Ring**: 2px solid focus color with 2px offset
- **Color**: Primary blue for form elements
- **Accessibility**: High contrast, keyboard navigation support

### Loading States
- **Pulse**: Gentle pulsing animation for loading content
- **Shimmer**: Horizontal shimmer effect for skeleton loading
- **Duration**: 2s infinite with ease-in-out timing

### Page Transitions
- **Slide In**: Content appears from bottom with slight scale
- **Fade In**: Opacity transition with subtle transform
- **Duration**: 300ms with ease-out timing

## Accessibility Guidelines

### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio for normal text
- **Large Text**: Minimum 3:1 contrast ratio for headings
- **Interactive**: Clear visual distinction for all states

### Focus Management
- **Visible**: All interactive elements have clear focus indicators
- **Logical**: Tab order follows visual layout
- **Trapped**: Modal dialogs trap focus within content

### Screen Readers
- **Semantic**: Proper HTML semantics and ARIA labels
- **Content**: Meaningful alt text and descriptions
- **Status**: Dynamic content changes announced appropriately

## Responsive Design

### Breakpoints
- **Mobile**: < 768px - Single column, larger touch targets
- **Tablet**: 768px - 1024px - Adapted layouts, comfortable spacing
- **Desktop**: > 1024px - Full feature set, optimal layouts

### Layout Principles
- **Mobile First**: Design starts with mobile constraints
- **Progressive Enhancement**: Add features for larger screens
- **Touch Friendly**: Minimum 44px touch targets on mobile

## Usage Examples

### CSS Classes

```css
/* Primary button with icon */
<button class="konver-button-primary">
  <Icon />
  Create Assistant
</button>

/* Interactive card with hover effects */
<div class="konver-card-interactive">
  <h3>Assistant Name</h3>
  <p>Description...</p>
</div>

/* Status indicator */
<span class="konver-status-success">
  Active
</span>

/* Text with gradient */
<h1 class="konver-text-gradient">
  Konver AI
</h1>
```

### Component Combinations

```css
/* Enhanced card with glass effect */
<div class="konver-glass konver-hover rounded-xl p-6">
  <!-- Content -->
</div>

/* Floating action with animations */
<button class="konver-button-accent animate-float">
  <!-- Action content -->
</button>
```

## Brand Voice in Design

### Visual Personality
- **Professional**: Clean layouts, consistent spacing
- **Innovative**: Subtle gradients, modern interactions
- **Trustworthy**: Clear hierarchy, predictable patterns
- **Approachable**: Warm colors, gentle animations

### Content Presentation
- **Clarity**: Clear headings and logical information flow
- **Efficiency**: Quick actions and minimal cognitive load
- **Confidence**: Positive language and clear success states
- **Support**: Helpful hints and error recovery guidance

## Implementation Notes

### Development Guidelines
1. **CSS Custom Properties**: Use design tokens for consistency
2. **Component Classes**: Prefer utility classes over custom CSS
3. **Responsive**: Test across all supported devices
4. **Performance**: Optimize animations and transitions
5. **Accessibility**: Test with keyboard and screen readers

### Design Handoff
1. **Specifications**: Include exact spacing and color values
2. **Interactions**: Document hover, focus, and loading states
3. **Responsive**: Provide designs for key breakpoints
4. **Accessibility**: Include ARIA requirements and focus flow
5. **Edge Cases**: Consider error states and empty content

This design system serves as the foundation for building cohesive, user-friendly interfaces that reflect the Konver AI brand while prioritizing usability and accessibility.