# GitHub Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a modern web application built with:
- **Vite** - Fast build tool and development server
- **React 18** - UI library with TypeScript support
- **Firebase** - Backend services including Authentication, Firestore, and Storage
- **Tailwind CSS** - Utility-first CSS framework

## Design System & Styling Guidelines

### Color Palette
- **Primary Color**: `#5b3983` (Purple) - Main brand color
- **Secondary Color**: `#ffffff` (White) - Secondary/contrast color
- **Background**: Purple (`#5b3983`) for main pages
- **Popup/Modal Background**: White with purple text

### Typography
- **Font Family**: Montserrat for all text elements
- Use consistent font weights and sizes across the application

### UI Components
- **Buttons**: White background with border radius and box shadows
- **Cards/Containers**: Use box shadows for depth and elevation
- **Text on Purple Background**: Use white text
- **Text on White Background**: Use purple text (`#5b3983`)

### Visual Effects
- Apply box shadows to interactive elements and containers
- Use consistent border radius for modern appearance
- Maintain proper contrast ratios for accessibility

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Prefer functional components with hooks over class components
- Use type-only imports for TypeScript types: `import type { User } from 'firebase/auth'`
- Follow ESLint and Prettier configurations

### Firebase Integration
- All Firebase services are initialized in `src/lib/firebase.ts`
- Use the AuthContext for authentication state management
- Environment variables are prefixed with `VITE_` for Vite compatibility
- Never commit actual Firebase config values - use `.env.example` as template

### Component Structure
- Components are organized in `src/components/`
- Use proper TypeScript interfaces for props
- Implement proper error handling for async operations
- Use Tailwind CSS classes for styling
- Follow the design system: purple (#5b3983) backgrounds, white text, Montserrat font
- Apply box shadows and border radius to interactive elements

### State Management
- Use React Context for global state (like authentication)
- Prefer React hooks for local component state
- Keep Firebase operations in custom hooks or service functions

### Security
- All routes requiring authentication should use the PrivateRoute component
- Validate user input on both client and server side
- Follow Firebase security rules best practices

### Performance
- Use React.lazy for code splitting on route level
- Optimize Firebase queries with proper indexing
- Use Vite's built-in optimizations for production builds
