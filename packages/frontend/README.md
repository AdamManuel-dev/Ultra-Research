# @deep-research/frontend

Frontend UI for Deep Research Cockpit - A comprehensive web application for managing and visualizing deep research workflows.

## Overview

This package contains the React-based frontend application built with modern web technologies including Material-UI, Redux Toolkit, and Vite. The application provides an intuitive interface for researchers to create, manage, and analyze complex research projects.

## Tech Stack

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.0
- **UI Library**: Material-UI (MUI) 5.15
- **State Management**: Redux Toolkit 2.0 with React-Redux
- **Routing**: React Router DOM 6.21
- **Data Visualization**: Recharts 2.10, ReactFlow 11.10
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, TypeScript strict mode

## Project Structure

```
packages/frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page-level components
│   ├── store/          # Redux store configuration
│   ├── services/       # API services and data fetching
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles and theme
│   └── test/           # Test utilities and setup
├── docs/               # Documentation
│   ├── modules/        # Module-specific documentation
│   ├── ARCHITECTURE.md # Architecture overview
│   └── COMPONENTS.md   # Component catalog
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

From the monorepo root:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev --workspace=@deep-research/frontend
```

The application will be available at `http://localhost:5173` with:
- Hot module replacement (HMR)
- API proxy to backend at `/api` and `/events`
- WebSocket support for real-time events

### Building

Build for production:

```bash
npm run build --workspace=@deep-research/frontend
```

Preview production build:

```bash
npm run preview --workspace=@deep-research/frontend
```

## Development Workflow

### Code Quality

Run linting:

```bash
npm run lint --workspace=@deep-research/frontend
```

Auto-fix linting issues:

```bash
npm run lint:fix --workspace=@deep-research/frontend
```

Type checking:

```bash
npm run type-check --workspace=@deep-research/frontend
```

### Testing

Run tests:

```bash
npm run test --workspace=@deep-research/frontend
```

Run tests with UI:

```bash
npm run test:ui --workspace=@deep-research/frontend
```

Generate coverage report:

```bash
npm run test:coverage --workspace=@deep-research/frontend
```

## Configuration

### Path Aliases

The following path aliases are configured for convenient imports:

- `@/*` - Maps to `src/*`
- `@deep-research/shared/*` - Maps to shared package

Example usage:

```typescript
import { Button } from '@/components/Button';
import { EventType } from '@deep-research/shared/types';
```

### API Proxy

The development server proxies API requests to the backend:

- `/api/*` → `http://localhost:3000/api/*`
- `/events` → `http://localhost:3000/events` (WebSocket enabled)

### Environment Variables

Create a `.env` file in the package root for environment-specific configuration:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Architecture

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Component Catalog

See [COMPONENTS.md](./docs/COMPONENTS.md) for a complete component reference.

## Contributing

### File Header Requirements

All source files must include a standardized header:

```typescript
/**
 * @fileoverview Brief description of file purpose
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Key capabilities, comma-separated
 * Main APIs: Primary functions/components
 * Constraints: Dependencies, limitations, requirements
 * Patterns: Error handling, conventions, best practices
 */
```

### Component Documentation

React components should include TSDoc comments:

```typescript
/**
 * Button component with customizable variants and sizes
 *
 * @param props - Component props
 * @returns Styled button element
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="large" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */
```

### Code Style

- TypeScript strict mode enabled
- ESLint with React and React Hooks plugins
- Functional components with hooks (no class components)
- Prefer named exports over default exports
- Use `const` for component definitions

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [Components](./docs/COMPONENTS.md) - Component library reference
- [Hooks](./docs/modules/hooks.md) - Custom hooks documentation
- [Utils](./docs/modules/utils.md) - Utility functions reference
- [State Management](./docs/modules/state.md) - Redux store structure
- [Development Guide](./docs/DEVELOPMENT.md) - Development best practices

## Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start development server with HMR |
| `build` | Build for production |
| `preview` | Preview production build |
| `test` | Run tests with Vitest |
| `test:ui` | Run tests with UI |
| `test:coverage` | Generate coverage report |
| `lint` | Run ESLint |
| `lint:fix` | Auto-fix ESLint issues |
| `type-check` | Run TypeScript type checking |
| `clean` | Remove build artifacts |

## Performance Optimization

- React.memo for expensive components
- useMemo/useCallback for computed values
- Code splitting with React.lazy
- Bundle size monitoring
- Lighthouse CI integration (planned)

## Troubleshooting

### Common Issues

**Port 5173 already in use:**
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9
```

**TypeScript errors after dependency updates:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Tests failing in CI:**
```bash
# Ensure test setup file exists
mkdir -p src/test
touch src/test/setup.ts
```

## Resources

- [React Documentation](https://react.dev)
- [Material-UI](https://mui.com/material-ui/getting-started/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

## License

See root LICENSE file.

## Support

For questions or issues, please open an issue in the GitHub repository.
