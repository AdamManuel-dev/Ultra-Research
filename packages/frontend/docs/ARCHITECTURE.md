# Frontend Architecture

This document describes the architecture and design decisions for the Deep Research Cockpit frontend application.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Routing](#routing)
- [Styling Strategy](#styling-strategy)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

## Overview

The frontend is a single-page application (SPA) built with React and TypeScript, designed for researchers to manage complex research workflows. The architecture emphasizes:

- **Modularity**: Separate concerns with clear boundaries
- **Type Safety**: Full TypeScript coverage
- **Performance**: Optimized rendering and bundle size
- **Maintainability**: Clear patterns and documentation
- **Scalability**: Support for growing feature set

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | UI framework |
| TypeScript | 5.3+ | Type safety |
| Vite | 5.0+ | Build tool and dev server |
| Redux Toolkit | 2.0+ | State management |
| Material-UI | 5.15+ | Component library |
| React Router | 6.21+ | Client-side routing |

### Supporting Libraries

| Library | Purpose |
|---------|---------|
| Recharts | Data visualization (charts) |
| ReactFlow | Flow diagram visualization |
| Emotion | CSS-in-JS styling |
| Vitest | Unit and integration testing |
| React Testing Library | Component testing |

### Development Tools

- **ESLint**: Code quality and consistency
- **TypeScript Compiler**: Type checking
- **Vite**: Fast HMR and optimized builds
- **Redux DevTools**: State debugging

## Application Structure

### Directory Organization

```
packages/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Generic components (Button, Card, etc.)
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   ├── forms/           # Form components
│   │   ├── data/            # Data display components
│   │   ├── visualization/   # Charts and graphs
│   │   └── research/        # Domain-specific components
│   │
│   ├── pages/               # Page-level components
│   │   ├── Dashboard/
│   │   ├── Projects/
│   │   ├── Research/
│   │   └── Settings/
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useForm.ts
│   │   ├── useFetch.ts
│   │   └── useWebSocket.ts
│   │
│   ├── store/               # Redux store configuration
│   │   ├── store.ts         # Store setup
│   │   ├── hooks.ts         # Typed hooks
│   │   ├── slices/          # Redux slices
│   │   │   ├── userSlice.ts
│   │   │   ├── projectsSlice.ts
│   │   │   └── researchSlice.ts
│   │   └── api/             # RTK Query API definitions
│   │
│   ├── services/            # API and external services
│   │   ├── api.ts           # Base API client
│   │   ├── projects.ts      # Project API
│   │   └── research.ts      # Research API
│   │
│   ├── utils/               # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── models.ts        # Data models
│   │   ├── api.ts           # API types
│   │   └── common.ts        # Common types
│   │
│   ├── styles/              # Global styles and theme
│   │   ├── theme.ts         # MUI theme configuration
│   │   ├── global.css       # Global CSS
│   │   └── variables.css    # CSS variables
│   │
│   ├── test/                # Test utilities and setup
│   │   ├── setup.ts         # Test environment setup
│   │   ├── mocks.ts         # Mock data and functions
│   │   └── utils.ts         # Test helpers
│   │
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Application entry point
│   └── router.tsx           # Route configuration
│
├── docs/                    # Documentation
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Package metadata
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ProjectCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useForm.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `UserProfile.ts`)
- **Tests**: Match source file with `.test.tsx` suffix

## Design Patterns

### Component Patterns

#### 1. Presentational vs Container Components

**Presentational Components**: Display UI based on props

```typescript
interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      <Typography variant="h6">{project.name}</Typography>
      <Button onClick={onEdit}>Edit</Button>
      <Button onClick={onDelete}>Delete</Button>
    </Card>
  );
};
```

**Container Components**: Manage state and logic

```typescript
export const ProjectCardContainer: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const dispatch = useAppDispatch();
  const project = useAppSelector(state =>
    selectProjectById(state, projectId)
  );

  const handleEdit = () => {
    dispatch(editProject(projectId));
  };

  const handleDelete = () => {
    dispatch(deleteProject(projectId));
  };

  if (!project) return null;

  return (
    <ProjectCard
      project={project}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
```

#### 2. Compound Components

Related components that work together:

```typescript
export const Tabs = {
  Root: TabsRoot,
  Tab: Tab,
  Panel: TabPanel,
};

// Usage
<Tabs.Root>
  <Tabs.Tab>Tab 1</Tabs.Tab>
  <Tabs.Tab>Tab 2</Tabs.Tab>
  <Tabs.Panel>Content 1</Tabs.Panel>
  <Tabs.Panel>Content 2</Tabs.Panel>
</Tabs.Root>
```

#### 3. Render Props

Share logic through render props:

```typescript
interface FetchDataProps<T> {
  url: string;
  render: (data: T, loading: boolean, error?: Error) => React.ReactNode;
}

export const FetchData = <T,>({ url, render }: FetchDataProps<T>) => {
  const { data, loading, error } = useFetch<T>(url);
  return <>{render(data, loading, error)}</>;
};
```

#### 4. Higher-Order Components (HOC)

Enhance components with additional functionality:

```typescript
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};
```

### State Management Patterns

#### 1. Normalized State

Store entities by ID for efficient updates:

```typescript
interface ProjectsState {
  entities: Record<string, Project>;
  ids: string[];
  selectedId: string | null;
}
```

#### 2. Computed State with Selectors

Derive state using memoized selectors:

```typescript
export const selectActiveProjects = createSelector(
  [selectProjects],
  (projects) => projects.filter(p => p.status === 'active')
);
```

#### 3. Optimistic Updates

Update UI immediately, rollback on error:

```typescript
const handleUpdate = async (updates: Partial<Project>) => {
  const original = project;

  // Optimistic update
  dispatch(updateProjectLocal({ ...project, ...updates }));

  try {
    await dispatch(updateProjectAPI({ id: project.id, updates })).unwrap();
  } catch (error) {
    // Rollback
    dispatch(updateProjectLocal(original));
    toast.error('Update failed');
  }
};
```

## Data Flow

### Unidirectional Data Flow

```
User Action
    ↓
Action Dispatch
    ↓
Reducer/Slice
    ↓
State Update
    ↓
Component Re-render
```

### API Data Flow

```
Component
    ↓
Async Thunk / RTK Query
    ↓
API Service Layer
    ↓
HTTP Request
    ↓
Backend API
    ↓
HTTP Response
    ↓
Redux State Update
    ↓
Component Re-render
```

### Real-time Data Flow (WebSocket)

```
WebSocket Connection
    ↓
Message Received
    ↓
Event Handler
    ↓
Redux Action Dispatch
    ↓
State Update
    ↓
Component Re-render
```

## Routing

### Route Structure

```
/                           # Dashboard
/projects                   # Projects list
/projects/:id               # Project detail
/projects/:id/research      # Research within project
/research                   # Research queries
/research/:id               # Query results
/settings                   # User settings
/profile                    # User profile
```

### Route Configuration

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'projects',
        children: [
          { index: true, element: <ProjectsList /> },
          { path: ':id', element: <ProjectDetail /> },
          { path: ':id/research', element: <ProjectResearch /> },
        ],
      },
      {
        path: 'research',
        children: [
          { index: true, element: <ResearchQueries /> },
          { path: ':id', element: <QueryResults /> },
        ],
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
]);
```

### Protected Routes

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authenticated = useAppSelector(state => state.user.authenticated);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Styling Strategy

### Material-UI Theme

```typescript
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
  },
  spacing: 8,
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### Styling Approaches

1. **sx prop**: Quick, one-off styles
2. **styled components**: Reusable styled elements
3. **Theme system**: Global design tokens
4. **CSS modules**: Component-specific styles

## Performance Optimization

### Code Splitting

Split routes for smaller initial bundle:

```typescript
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/projects" element={<Projects />} />
  </Routes>
</Suspense>
```

### Memoization

Prevent unnecessary re-renders:

```typescript
// Component memoization
export const ExpensiveComponent = React.memo(Component);

// Value memoization
const sortedData = useMemo(() => sort(data), [data]);

// Callback memoization
const handleClick = useCallback(() => {
  dispatch(action());
}, [dispatch]);
```

### Virtual Scrolling

For large lists, use virtual scrolling:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  )}
</FixedSizeList>
```

### Bundle Optimization

- Tree shaking for unused code
- Dynamic imports for large dependencies
- Image optimization and lazy loading
- Minimize third-party dependencies

## Security Considerations

### Authentication

```typescript
// Store JWT token securely
const token = useAppSelector(state => state.user.token);

// Add token to API requests
const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### XSS Prevention

- Use React's built-in XSS protection
- Sanitize user input before rendering
- Use Content Security Policy headers

### CSRF Protection

- Use CSRF tokens for mutations
- Same-site cookies
- Validate origin headers

### Input Validation

- Client-side validation for UX
- Server-side validation for security
- Type checking with TypeScript
- Schema validation for API responses

## Future Enhancements

### Planned Features

1. **Progressive Web App (PWA)**
   - Offline support
   - App-like experience
   - Push notifications

2. **Internationalization (i18n)**
   - Multi-language support
   - Locale-aware formatting
   - RTL layout support

3. **Advanced Analytics**
   - User behavior tracking
   - Performance monitoring
   - Error tracking

4. **Accessibility**
   - WCAG 2.1 Level AA compliance
   - Screen reader optimization
   - Keyboard navigation

5. **Real-time Collaboration**
   - Shared research projects
   - Live cursor presence
   - Collaborative editing

### Technical Debt

- Migrate to React Server Components (when stable)
- Implement comprehensive E2E tests
- Add Storybook for component documentation
- Performance profiling and optimization

## Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Material-UI](https://mui.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Last updated: 2025-10-28
