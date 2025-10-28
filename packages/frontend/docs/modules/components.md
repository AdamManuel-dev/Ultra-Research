# Component Library Documentation

This guide provides detailed information about building and using components in the Deep Research Cockpit frontend application.

## Table of Contents

- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Building Components](#building-components)
- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [Styling](#styling)
- [Testing](#testing)
- [Performance](#performance)

## Overview

The component library is built on React 18 with TypeScript, Material-UI, and follows functional component patterns with hooks. All components are designed to be:

- **Reusable**: Work across different contexts
- **Composable**: Combine to create complex UIs
- **Accessible**: WCAG 2.1 Level AA compliant
- **Performant**: Optimized rendering and bundle size
- **Type-safe**: Full TypeScript support

## Component Architecture

### Component Hierarchy

```
App
├── AppLayout (layout container)
│   ├── Header (navigation, user menu)
│   ├── Sidebar (navigation menu)
│   └── PageContent (main content area)
│       └── Pages (route-specific components)
│           ├── ResearchDashboard
│           ├── ProjectDetail
│           └── Settings
└── Providers (context, theme, store)
```

### Component Types

#### 1. Presentational Components

Pure components that receive data via props and render UI.

**Characteristics**:
- No state management
- No side effects
- Highly reusable
- Easy to test

**Example**:
```typescript
export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'medium' }) => (
  <img
    src={src}
    alt={alt}
    style={{ width: sizeMap[size], height: sizeMap[size] }}
  />
);
```

#### 2. Container Components

Components that manage state and business logic.

**Characteristics**:
- Connect to Redux store
- Handle API calls
- Manage local state
- Pass data to presentational components

**Example**:
```typescript
export const ResearchListContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectProjects);
  const loading = useAppSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return <ResearchList projects={projects} loading={loading} />;
};
```

#### 3. Layout Components

Components that define page structure and navigation.

**Characteristics**:
- Responsive design
- Navigation logic
- Consistent across pages
- Support for nested routes

#### 4. Page Components

Top-level components for routes.

**Characteristics**:
- Route configuration
- Data fetching
- Page-specific layout
- SEO metadata

## Building Components

### Component Template

```typescript
/**
 * @fileoverview [Component name and purpose]
 * @lastmodified [ISO timestamp]
 *
 * Features: [Key capabilities]
 * Main APIs: [Primary props and methods]
 * Constraints: [Dependencies, limitations]
 * Patterns: [Usage patterns, best practices]
 */

import React, { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * [Component description]
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <MyComponent
 *   title="Example"
 *   onAction={handleAction}
 * />
 * ```
 */
export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  children,
  onAction,
}) => {
  // Memoized values
  const processedData = useMemo(() => {
    // Expensive computation
    return transform(title);
  }, [title]);

  // Callbacks
  const handleClick = useCallback(() => {
    onAction?.(processedData);
  }, [onAction, processedData]);

  // Render
  return (
    <Box>
      <Typography variant="h2">{title}</Typography>
      <Box onClick={handleClick}>
        {children}
      </Box>
    </Box>
  );
};

/**
 * Props for MyComponent
 */
export interface MyComponentProps {
  /** Component title */
  title: string;

  /** Child components */
  children?: React.ReactNode;

  /** Action handler */
  onAction?: (data: string) => void;
}
```

### Props Best Practices

#### 1. Define Interfaces

Always define TypeScript interfaces for props:

```typescript
export interface ButtonProps {
  /** Button label text */
  label: string;

  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'text';

  /** Disabled state */
  disabled?: boolean;

  /** Click handler */
  onClick?: () => void;
}
```

#### 2. Use Optional Props with Defaults

Provide sensible defaults using default parameters:

```typescript
export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
}) => {
  // Implementation
};
```

#### 3. Document Props

Use TSDoc comments to document each prop:

```typescript
export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];

  /** Column configuration */
  columns: Column<T>[];

  /** Loading state indicator */
  loading?: boolean;

  /** Row click handler
   * @param row - The clicked row data
   */
  onRowClick?: (row: T) => void;
}
```

## Component Patterns

### Compound Components

Create related components that work together:

```typescript
export const Tabs: React.FC<TabsProps> & {
  Tab: typeof Tab;
  Panel: typeof TabPanel;
} = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage
<Tabs>
  <Tabs.Tab>Tab 1</Tabs.Tab>
  <Tabs.Tab>Tab 2</Tabs.Tab>
  <Tabs.Panel>Content 1</Tabs.Panel>
  <Tabs.Panel>Content 2</Tabs.Panel>
</Tabs>
```

### Render Props

Share logic through render prop pattern:

```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (data: T, loading: boolean, error?: Error) => React.ReactNode;
}

export const DataFetcher = <T,>({ url, render }: DataFetcherProps<T>) => {
  const { data, loading, error } = useFetch<T>(url);
  return <>{render(data, loading, error)}</>;
};

// Usage
<DataFetcher
  url="/api/projects"
  render={(data, loading, error) => (
    loading ? <Spinner /> : <ProjectList projects={data} />
  )}
/>
```

### Custom Hooks

Extract reusable logic into custom hooks:

```typescript
/**
 * Hook for managing form state with validation
 *
 * @param initialValues - Initial form values
 * @param validationSchema - Validation rules
 * @returns Form state and handlers
 */
export const useForm = <T extends Record<string, unknown>>(
  initialValues: T,
  validationSchema: ValidationSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback((name: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validate field
  }, []);

  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    // Validate all fields
    // Call onSubmit if valid
  }, [values]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  };
};
```

### Error Boundaries

Wrap components in error boundaries for graceful error handling:

```typescript
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <ComplexComponent />
</ErrorBoundary>
```

## State Management

### Local State

Use `useState` for component-specific state:

```typescript
export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
```

### Global State (Redux)

Connect to Redux store for shared state:

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, updateUser } from '@/store/slices/userSlice';

export const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const handleUpdate = useCallback((data: UserData) => {
    dispatch(updateUser(data));
  }, [dispatch]);

  return <ProfileForm user={user} onSubmit={handleUpdate} />;
};
```

### Context API

Use Context for component tree state:

```typescript
interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

## Styling

### Material-UI sx Prop

For simple, one-off styles:

```typescript
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 3,
    bgcolor: 'background.paper',
    borderRadius: 1,
  }}
>
  Content
</Box>
```

### styled-components

For complex, reusable styles:

```typescript
import { styled } from '@mui/material/styles';

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],

  '&:hover': {
    boxShadow: theme.shadows[4],
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));
```

### Theme Integration

Use theme values for consistency:

```typescript
import { useTheme } from '@mui/material/styles';

export const CustomComponent: React.FC = () => {
  const theme = useTheme();

  return (
    <div style={{
      color: theme.palette.primary.main,
      padding: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
    }}>
      Content
    </div>
  );
};
```

## Testing

### Unit Tests

Test component rendering and behavior:

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
});
```

### Integration Tests

Test component interactions:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ProjectForm } from './ProjectForm';

describe('ProjectForm integration', () => {
  it('submits form and updates store', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <ProjectForm />
      </Provider>
    );

    await user.type(screen.getByLabelText('Project Name'), 'Test Project');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(store.getState().projects.items).toHaveLength(1);
    });
  });
});
```

## Performance

### React.memo

Prevent unnecessary re-renders:

```typescript
export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  ({ data, onAction }) => {
    // Expensive rendering logic
    return <div>{/* ... */}</div>;
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### useMemo

Memoize expensive computations:

```typescript
const sortedData = useMemo(() => {
  return [...data].sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

### useCallback

Memoize callback functions:

```typescript
const handleSubmit = useCallback((values: FormData) => {
  dispatch(submitForm(values));
}, [dispatch]);
```

### Code Splitting

Use React.lazy for route-based splitting:

```typescript
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

## Resources

- [React Documentation](https://react.dev)
- [Material-UI Components](https://mui.com/material-ui/getting-started/)
- [React Testing Library](https://testing-library.com/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Last updated: 2025-10-28
