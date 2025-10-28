# State Management Documentation

This guide documents the Redux state management architecture for the Deep Research Cockpit frontend application.

## Table of Contents

- [Overview](#overview)
- [Store Configuration](#store-configuration)
- [Slices](#slices)
- [Async Operations](#async-operations)
- [Selectors](#selectors)
- [Middleware](#middleware)
- [Best Practices](#best-practices)

## Overview

The application uses Redux Toolkit for state management, providing:

- **Type-safe state management**: Full TypeScript support
- **Simplified Redux patterns**: Less boilerplate with createSlice
- **Built-in devtools**: Redux DevTools integration
- **Async handling**: createAsyncThunk for API calls
- **Immutable updates**: Immer for state mutations

### State Structure

```typescript
{
  user: UserState,
  projects: ProjectsState,
  research: ResearchState,
  ui: UIState,
  notifications: NotificationsState,
}
```

## Store Configuration

### Store Setup

**Status**: Planned

```typescript
/**
 * @fileoverview Redux store configuration
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Redux Toolkit store, middleware, DevTools
 * Main APIs: store, RootState, AppDispatch types
 * Constraints: Requires Redux DevTools extension
 * Patterns: Centralized store, typed hooks, middleware chain
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from './slices/userSlice';
import projectsReducer from './slices/projectsSlice';
import researchReducer from './slices/researchSlice';
import uiReducer from './slices/uiSlice';
import notificationsReducer from './slices/notificationsSlice';
import { apiSlice } from './api/apiSlice';

/**
 * Configure Redux store with reducers and middleware
 */
export const store = configureStore({
  reducer: {
    user: userReducer,
    projects: projectsReducer,
    research: researchReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific action types or paths
        ignoredActions: ['api/executeQuery/fulfilled'],
        ignoredPaths: ['items.date'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for RTK Query
setupListeners(store.dispatch);

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

**Status**: Planned

```typescript
/**
 * @fileoverview Typed Redux hooks
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Type-safe useDispatch and useSelector hooks
 * Main APIs: useAppDispatch, useAppSelector
 * Constraints: Must be used within Redux Provider
 * Patterns: Export typed hooks for application use
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed dispatch hook for Redux actions
 *
 * @returns Typed dispatch function
 *
 * @example
 * ```tsx
 * const dispatch = useAppDispatch();
 * dispatch(fetchProjects());
 * ```
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed selector hook for Redux state
 *
 * @returns Selected state with type safety
 *
 * @example
 * ```tsx
 * const projects = useAppSelector(state => state.projects.items);
 * const user = useAppSelector(selectCurrentUser);
 * ```
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Slices

### Slice Template

**Status**: Planned

```typescript
/**
 * @fileoverview [Slice name] Redux slice
 * @lastmodified [ISO timestamp]
 *
 * Features: [State management for specific domain]
 * Main APIs: [Actions and selectors]
 * Constraints: [Dependencies and limitations]
 * Patterns: [Async thunks, normalized state, etc.]
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * State interface for [domain]
 */
export interface DomainState {
  items: DomainItem[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DomainState = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
};

/**
 * Async thunk to fetch items
 */
export const fetchItems = createAsyncThunk(
  'domain/fetchItems',
  async (params: FetchParams, { rejectWithValue }) => {
    try {
      const response = await api.fetchItems(params);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Domain slice with reducers and actions
 */
const domainSlice = createSlice({
  name: 'domain',
  initialState,
  reducers: {
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedId = null;
    },
    updateItem: (state, action: PayloadAction<DomainItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { selectItem, clearSelection, updateItem } = domainSlice.actions;

// Export selectors
export const selectItems = (state: RootState) => state.domain.items;
export const selectSelectedId = (state: RootState) => state.domain.selectedId;
export const selectLoading = (state: RootState) => state.domain.loading;
export const selectError = (state: RootState) => state.domain.error;

// Memoized selector
export const selectSelectedItem = (state: RootState) => {
  const items = selectItems(state);
  const selectedId = selectSelectedId(state);
  return items.find(item => item.id === selectedId) || null;
};

// Export reducer
export default domainSlice.reducer;
```

### User Slice

**Status**: Planned

Manages user authentication and profile state.

```typescript
interface UserState {
  profile: UserProfile | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Actions
login(credentials: LoginCredentials)
logout()
updateProfile(profile: Partial<UserProfile>)
```

### Projects Slice

**Status**: Planned

Manages research projects state.

```typescript
interface ProjectsState {
  items: Project[];
  selectedId: string | null;
  filters: ProjectFilters;
  sort: SortConfig;
  loading: boolean;
  error: string | null;
}

// Actions
fetchProjects(filters?: ProjectFilters)
createProject(project: CreateProjectData)
updateProject(id: string, updates: Partial<Project>)
deleteProject(id: string)
selectProject(id: string)
```

### Research Slice

**Status**: Planned

Manages research query and results state.

```typescript
interface ResearchState {
  queries: Query[];
  results: Record<string, ResearchResult[]>;
  activeQueryId: string | null;
  loading: boolean;
  error: string | null;
}

// Actions
executeQuery(query: Query)
saveQuery(query: Query)
deleteQuery(id: string)
setActiveQuery(id: string)
```

### UI Slice

**Status**: Planned

Manages UI state (modals, sidebars, themes).

```typescript
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  modals: Record<string, boolean>;
  notifications: Notification[];
}

// Actions
toggleTheme()
toggleSidebar()
openModal(modalId: string)
closeModal(modalId: string)
showNotification(notification: Notification)
dismissNotification(id: string)
```

## Async Operations

### createAsyncThunk

**Status**: Planned

Handle asynchronous operations with Redux Toolkit.

```typescript
/**
 * Async thunk for creating project
 *
 * @param projectData - Project creation data
 * @returns Created project
 *
 * @example
 * ```tsx
 * const dispatch = useAppDispatch();
 * await dispatch(createProject({ name: 'New Project' }));
 * ```
 */
export const createProject = createAsyncThunk<
  Project,
  CreateProjectData,
  { rejectValue: string }
>(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await api.createProject(projectData);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

// Usage in slice
extraReducers: (builder) => {
  builder
    .addCase(createProject.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createProject.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    })
    .addCase(createProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to create project';
    });
}
```

### RTK Query

**Status**: Planned

Use RTK Query for advanced API interactions.

```typescript
/**
 * @fileoverview RTK Query API slice
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Auto-generated hooks, caching, polling
 * Main APIs: Project and research endpoints
 * Constraints: Requires Redux store setup
 * Patterns: Tag-based invalidation, optimistic updates
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Project', 'Research'],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<Project, CreateProjectData>({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<Project, { id: string; updates: Partial<Project> }>({
      query: ({ id, updates }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = apiSlice;
```

## Selectors

### Basic Selectors

**Status**: Planned

Simple state selection functions.

```typescript
/**
 * Select all projects from state
 */
export const selectProjects = (state: RootState) => state.projects.items;

/**
 * Select projects loading state
 */
export const selectProjectsLoading = (state: RootState) => state.projects.loading;

/**
 * Select selected project ID
 */
export const selectSelectedProjectId = (state: RootState) => state.projects.selectedId;
```

### Memoized Selectors

**Status**: Planned

Use Reselect for computed/derived state.

```typescript
import { createSelector } from '@reduxjs/toolkit';

/**
 * Select currently selected project
 */
export const selectSelectedProject = createSelector(
  [selectProjects, selectSelectedProjectId],
  (projects, selectedId) => {
    return projects.find(project => project.id === selectedId) || null;
  }
);

/**
 * Select filtered and sorted projects
 */
export const selectFilteredProjects = createSelector(
  [
    selectProjects,
    (state: RootState) => state.projects.filters,
    (state: RootState) => state.projects.sort,
  ],
  (projects, filters, sort) => {
    let filtered = projects;

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      const multiplier = sort.direction === 'asc' ? 1 : -1;
      return (aVal < bVal ? -1 : 1) * multiplier;
    });
  }
);

/**
 * Select project statistics
 */
export const selectProjectStats = createSelector(
  [selectProjects],
  (projects) => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length,
  })
);
```

## Middleware

### Custom Middleware

**Status**: Planned

Create custom middleware for cross-cutting concerns.

```typescript
/**
 * @fileoverview Custom Redux middleware
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Logging, analytics, error tracking
 * Main APIs: Logger, analytics, error middleware
 * Constraints: Should not modify actions
 * Patterns: Middleware chain, next() delegation
 */

import { Middleware } from '@reduxjs/toolkit';

/**
 * Logger middleware for development
 */
export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  console.group(action.type);
  console.info('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  console.groupEnd();
  return result;
};

/**
 * Analytics middleware for tracking user actions
 */
export const analyticsMiddleware: Middleware = () => (next) => (action) => {
  // Track specific actions
  if (action.type.includes('fulfilled')) {
    analytics.track('Action Completed', {
      action: action.type,
      timestamp: Date.now(),
    });
  }
  return next(action);
};

/**
 * Error tracking middleware
 */
export const errorMiddleware: Middleware = () => (next) => (action) => {
  if (action.type.includes('rejected')) {
    errorTracker.captureError(new Error(action.error?.message), {
      action: action.type,
      payload: action.payload,
    });
  }
  return next(action);
};
```

## Best Practices

### State Shape

1. **Normalize nested data**: Use entities with IDs
2. **Separate UI state**: Keep UI state separate from data
3. **Single source of truth**: Avoid data duplication
4. **Flat structure**: Minimize nesting depth

```typescript
// Good: Normalized state
interface ProjectsState {
  entities: Record<string, Project>;
  ids: string[];
  selectedId: string | null;
}

// Bad: Nested structure
interface ProjectsState {
  projects: {
    [id: string]: {
      data: Project;
      metadata: {
        selected: boolean;
        loading: boolean;
      };
    };
  };
}
```

### Action Naming

Use consistent action naming conventions:

```typescript
// Pattern: domain/action
'user/login'
'projects/create'
'research/executeQuery'

// Async actions
'projects/fetch/pending'
'projects/fetch/fulfilled'
'projects/fetch/rejected'
```

### Immutable Updates

Use Immer (built into RTK) for immutable updates:

```typescript
// Good: Immer handles immutability
reducers: {
  addProject: (state, action) => {
    state.items.push(action.payload);
  },
  updateProject: (state, action) => {
    const project = state.items.find(p => p.id === action.payload.id);
    if (project) {
      project.name = action.payload.name;
    }
  },
}

// Bad: Manual immutability (unnecessary with RTK)
reducers: {
  addProject: (state, action) => {
    return {
      ...state,
      items: [...state.items, action.payload],
    };
  },
}
```

### Error Handling

Consistent error handling across async operations:

```typescript
export const fetchProjects = createAsyncThunk(
  'projects/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.fetchProjects();
      return response.data;
    } catch (error) {
      // Normalize error format
      const message = error instanceof Error
        ? error.message
        : 'Unknown error occurred';
      return rejectWithValue(message);
    }
  }
);
```

### Testing Redux

Test slices, selectors, and async thunks:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, { fetchProjects, selectProjects } from './projectsSlice';

describe('Projects Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({ reducer: { projects: projectsReducer } });
  });

  it('handles fetchProjects.fulfilled', () => {
    const projects = [{ id: '1', name: 'Test' }];
    store.dispatch(fetchProjects.fulfilled(projects, '', undefined));

    const state = store.getState();
    expect(selectProjects(state)).toEqual(projects);
  });

  it('handles fetchProjects.rejected', () => {
    const error = 'Failed to fetch';
    store.dispatch(fetchProjects.rejected(null, '', undefined, error));

    const state = store.getState();
    expect(state.projects.error).toBe(error);
  });
});
```

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Reselect Documentation](https://github.com/reduxjs/reselect)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

---

Last updated: 2025-10-28
