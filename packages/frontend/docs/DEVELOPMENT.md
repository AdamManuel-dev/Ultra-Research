# Development Guide

This guide provides best practices and guidelines for developing the Deep Research Cockpit frontend application.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Component Development](#component-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Backend API running locally

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd UltraResearch

# Install dependencies
npm install

# Start development server
npm run dev --workspace=@deep-research/frontend
```

The application will be available at `http://localhost:5173`.

### VS Code Extensions

Recommended extensions for optimal development experience:

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **TypeScript Vue Plugin**: TypeScript support
- **Error Lens**: Inline error display
- **Git Graph**: Visualize git history
- **Thunder Client**: API testing

## Development Workflow

### Daily Development Flow

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start dev server**
   ```bash
   npm run dev --workspace=@deep-research/frontend
   ```

4. **Develop with hot reload**
   - Make changes to source files
   - Browser automatically reloads

5. **Run type checking**
   ```bash
   npm run type-check --workspace=@deep-research/frontend
   ```

6. **Run tests**
   ```bash
   npm run test --workspace=@deep-research/frontend
   ```

7. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

8. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Development Server Features

- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **API Proxy**: Automatic proxy to backend at `/api` and `/events`
- **WebSocket Support**: Real-time event handling
- **Source Maps**: Debug original TypeScript code
- **Error Overlay**: Visual error display in browser

## Code Standards

### TypeScript Standards

#### 1. Strict Type Safety

```typescript
// Good: Explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const user: UserProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

// Bad: Using 'any'
const user: any = { /* ... */ };
```

#### 2. Type Inference

```typescript
// Good: Let TypeScript infer obvious types
const count = 0; // number
const items = ['a', 'b']; // string[]

// Bad: Unnecessary type annotations
const count: number = 0;
const items: string[] = ['a', 'b'];
```

#### 3. Interfaces vs Types

```typescript
// Use interfaces for object shapes (can be extended)
interface ButtonProps {
  label: string;
  onClick: () => void;
}

interface PrimaryButtonProps extends ButtonProps {
  variant: 'primary';
}

// Use types for unions, intersections, and computed types
type Status = 'idle' | 'loading' | 'success' | 'error';
type Config = { timeout: number } & { retries: number };
```

### React Standards

#### 1. Functional Components

```typescript
// Good: Functional component with TypeScript
export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};

// Also good: Function declaration
export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Bad: Class component (avoid unless necessary)
class Button extends React.Component<ButtonProps> {
  render() {
    return <button>{this.props.label}</button>;
  }
}
```

#### 2. Hook Usage

```typescript
// Good: Follow hooks rules
const Component: React.FC = () => {
  const [state, setState] = useState(0);
  const value = useMemo(() => compute(state), [state]);
  const callback = useCallback(() => action(), []);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependency]);

  return <div>{value}</div>;
};

// Bad: Conditional hooks
const Component: React.FC = () => {
  if (condition) {
    const [state] = useState(0); // Never do this!
  }
  return <div />;
};
```

#### 3. Props Destructuring

```typescript
// Good: Destructure props
export const Card: React.FC<CardProps> = ({ title, children, onClose }) => {
  return (
    <div>
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// Bad: Access via props object
export const Card: React.FC<CardProps> = (props) => {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.children}
      <button onClick={props.onClose}>Close</button>
    </div>
  );
};
```

### File Organization

#### 1. Component Structure

```
components/Button/
├── Button.tsx          # Component implementation
├── Button.test.tsx     # Unit tests
├── Button.styles.ts    # Styled components
├── types.ts            # Type definitions
└── index.ts            # Public exports
```

#### 2. Export Strategy

```typescript
// index.ts - Barrel exports
export { Button } from './Button';
export type { ButtonProps } from './types';
export { useButton } from './hooks';

// Named exports preferred over default
export const Button: React.FC<ButtonProps> = () => { /* ... */ };

// Avoid default exports
export default Button; // Don't do this
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile`, `DataTable` |
| Hooks | camelCase with `use` | `useForm`, `useFetch` |
| Functions | camelCase | `formatDate`, `validateEmail` |
| Constants | UPPER_SNAKE_CASE | `API_URL`, `MAX_RETRY` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Files | Match export name | `UserProfile.tsx`, `useForm.ts` |

## Component Development

### Component Checklist

- [ ] TypeScript interface for props
- [ ] JSDoc documentation
- [ ] Accessibility attributes (ARIA)
- [ ] Error boundaries (for complex components)
- [ ] Unit tests
- [ ] Integration tests (if applicable)
- [ ] Responsive design
- [ ] Loading and error states
- [ ] Keyboard navigation

### Component Template

```typescript
/**
 * @fileoverview [Component name and purpose]
 * @lastmodified [ISO timestamp from `date -u +"%Y-%m-%dT%H:%M:%SZ"`]
 *
 * Features: [Key capabilities]
 * Main APIs: [Props and methods]
 * Constraints: [Dependencies and limitations]
 * Patterns: [Usage patterns]
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * [Component description]
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={value}
 *   onAction={handleAction}
 * />
 * ```
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  onAction,
}) => {
  // State
  const [localState, setLocalState] = useState<string>('');

  // Computed values
  const computed = useMemo(() => {
    return transform(prop1);
  }, [prop1]);

  // Event handlers
  const handleClick = useCallback(() => {
    onAction?.(computed);
  }, [onAction, computed]);

  // Render
  return (
    <Box>
      <Typography variant="h6">{prop1}</Typography>
      {/* Component content */}
    </Box>
  );
};

/**
 * Props for ComponentName
 */
export interface ComponentNameProps {
  /** First prop description */
  prop1: string;

  /** Second prop description */
  prop2?: number;

  /** Action handler
   * @param value - Action value
   */
  onAction?: (value: string) => void;
}

// Default export if needed
export default ComponentName;
```

### Accessibility Guidelines

```typescript
// Good: Accessible component
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled,
  ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};

// Keyboard navigation
export const Menu: React.FC<MenuProps> = ({ items }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        // Move to next item
        break;
      case 'ArrowUp':
        // Move to previous item
        break;
      case 'Enter':
        // Select item
        break;
      case 'Escape':
        // Close menu
        break;
    }
  };

  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map(item => (
        <li key={item.id} role="menuitem" tabIndex={0}>
          {item.label}
        </li>
      ))}
    </ul>
  );
};
```

## Testing

### Unit Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click me" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has accessible label', () => {
    render(<Button label="Click me" ariaLabel="Custom label" />);
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ProjectForm } from './ProjectForm';

describe('ProjectForm integration', () => {
  it('creates project on submit', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <ProjectForm />
      </Provider>
    );

    await user.type(screen.getByLabelText('Project Name'), 'Test Project');
    await user.type(screen.getByLabelText('Description'), 'Test description');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Project created successfully')).toBeInTheDocument();
    });
  });
});
```

### Test Coverage

Run coverage report:

```bash
npm run test:coverage --workspace=@deep-research/frontend
```

Coverage goals:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Debugging

### Browser DevTools

1. **React DevTools**: Inspect component tree and props
2. **Redux DevTools**: Time-travel debugging for state
3. **Network Tab**: Monitor API requests
4. **Console**: Log debugging information

### Debug Logging

```typescript
// Development logging
if (import.meta.env.DEV) {
  console.log('Component mounted:', props);
}

// Conditional logging
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Common Issues

**Issue**: Component not re-rendering
```typescript
// Solution: Ensure dependencies are correct
useEffect(() => {
  fetchData();
}, [fetchData]); // Include all dependencies
```

**Issue**: Stale state in callbacks
```typescript
// Solution: Use functional updates
const handleClick = () => {
  setState(prev => prev + 1); // Use previous state
};
```

**Issue**: Memory leaks
```typescript
// Solution: Clean up effects
useEffect(() => {
  const subscription = subscribe();

  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

## Git Workflow

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(projects): add project creation form
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
```

### Branch Naming

```
feature/short-description
bugfix/issue-number-description
hotfix/critical-issue
refactor/component-name
```

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Run quality checks
6. Create pull request
7. Address review feedback
8. Merge when approved

## Common Tasks

### Adding a New Component

```bash
# 1. Create component directory
mkdir -p src/components/MyComponent

# 2. Create files
touch src/components/MyComponent/MyComponent.tsx
touch src/components/MyComponent/MyComponent.test.tsx
touch src/components/MyComponent/index.ts

# 3. Implement component
# 4. Write tests
# 5. Export from index.ts
```

### Adding a Redux Slice

```bash
# 1. Create slice file
touch src/store/slices/mySlice.ts

# 2. Implement slice with actions and reducers
# 3. Add to store configuration
# 4. Create selectors
# 5. Write tests
```

### Adding a New Route

```typescript
// In router.tsx
{
  path: 'new-route',
  element: <NewPage />,
}
```

### Updating Dependencies

```bash
# Check for updates
npm outdated --workspace=@deep-research/frontend

# Update specific package
npm update package-name --workspace=@deep-research/frontend

# Update all packages
npm update --workspace=@deep-research/frontend
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -ti:5173

# Kill process
lsof -ti:5173 | xargs kill -9
```

### TypeScript Errors After Update

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

```bash
# Clear test cache
npm run test -- --clearCache

# Run specific test file
npm run test -- MyComponent.test.tsx

# Run in watch mode
npm run test -- --watch
```

### Build Errors

```bash
# Clean build
npm run clean --workspace=@deep-research/frontend
npm run build --workspace=@deep-research/frontend

# Check for type errors
npm run type-check --workspace=@deep-research/frontend
```

### Slow Development Server

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev --workspace=@deep-research/frontend
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/)
- [Material-UI](https://mui.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

Last updated: 2025-10-28
