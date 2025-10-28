# Component Catalog

> **Status**: This is a living document that will be updated as components are developed.

This document provides a comprehensive reference for all React components in the Deep Research Cockpit frontend application.

## Component Organization

Components are organized by category and functionality:

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components
│   ├── forms/           # Form components
│   ├── data/            # Data display components
│   ├── visualization/   # Charts and graphs
│   └── research/        # Research-specific components
└── pages/               # Page-level components
```

## Component Categories

### Common Components

Reusable UI components used throughout the application.

#### Button

**Status**: Planned

Material-UI enhanced button with custom variants.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Example**:
```tsx
<Button variant="primary" size="large" onClick={handleSubmit}>
  Submit Research
</Button>
```

#### Card

**Status**: Planned

Container component for grouping related content.

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  elevation?: number;
}
```

#### Modal

**Status**: Planned

Modal dialog component for forms and confirmations.

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

### Layout Components

Components that define the application structure and navigation.

#### AppLayout

**Status**: Planned

Main application layout with header, sidebar, and content area.

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}
```

**Features**:
- Responsive sidebar navigation
- Collapsible menu for mobile
- Breadcrumb navigation
- User profile menu

#### Header

**Status**: Planned

Application header with navigation and user controls.

```typescript
interface HeaderProps {
  title: string;
  user?: UserProfile;
  onMenuClick?: () => void;
  notifications?: number;
}
```

#### Sidebar

**Status**: Planned

Navigation sidebar with menu items and sub-menus.

```typescript
interface SidebarProps {
  items: MenuItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}
```

### Form Components

Components for data input and validation.

#### TextField

**Status**: Planned

Enhanced text input with validation and error handling.

```typescript
interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}
```

#### Select

**Status**: Planned

Dropdown select component with search and multi-select support.

```typescript
interface SelectProps<T> {
  name: string;
  label: string;
  options: T[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  error?: string;
}
```

#### DatePicker

**Status**: Planned

Date and time picker with range selection.

```typescript
interface DatePickerProps {
  name: string;
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
}
```

#### FormBuilder

**Status**: Planned

Dynamic form builder based on schema definition.

```typescript
interface FormBuilderProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}
```

### Data Components

Components for displaying and manipulating data.

#### DataTable

**Status**: Planned

Feature-rich data table with sorting, filtering, and pagination.

```typescript
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onRowClick?: (row: T) => void;
  pagination?: PaginationConfig;
}
```

**Features**:
- Column sorting and filtering
- Row selection
- Expandable rows
- Virtual scrolling for large datasets
- Export to CSV/Excel

#### DataGrid

**Status**: Planned

Advanced grid with inline editing and customizable cells.

```typescript
interface DataGridProps<T> {
  columns: GridColumn<T>[];
  rows: T[];
  editable?: boolean;
  onCellEdit?: (row: T, column: string, value: unknown) => void;
  onRowAdd?: () => void;
  onRowDelete?: (row: T) => void;
}
```

#### ListView

**Status**: Planned

List view with cards or compact display.

```typescript
interface ListViewProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  viewMode?: 'card' | 'compact' | 'detailed';
}
```

### Visualization Components

Components for data visualization and analytics.

#### LineChart

**Status**: Planned

Line chart for time-series data using Recharts.

```typescript
interface LineChartProps {
  data: DataPoint[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}
```

#### BarChart

**Status**: Planned

Bar chart for categorical data comparison.

```typescript
interface BarChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}
```

#### PieChart

**Status**: Planned

Pie/donut chart for proportional data.

```typescript
interface PieChartProps {
  data: DataPoint[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  innerRadius?: number;
  height?: number;
}
```

#### FlowDiagram

**Status**: Planned

Interactive flow diagram using ReactFlow for research workflows.

```typescript
interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodeClick?: (node: FlowNode) => void;
  onEdgeClick?: (edge: FlowEdge) => void;
  editable?: boolean;
  onNodesChange?: (nodes: FlowNode[]) => void;
  onEdgesChange?: (edges: FlowEdge[]) => void;
}
```

### Research Components

Domain-specific components for research workflows.

#### ResearchCard

**Status**: Planned

Card displaying research project summary.

```typescript
interface ResearchCardProps {
  project: ResearchProject;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}
```

#### QueryBuilder

**Status**: Planned

Visual query builder for research queries.

```typescript
interface QueryBuilderProps {
  query: Query;
  onChange: (query: Query) => void;
  schema: QuerySchema;
}
```

#### ResultsViewer

**Status**: Planned

Component for displaying and filtering research results.

```typescript
interface ResultsViewerProps {
  results: ResearchResult[];
  filters?: Filter[];
  onFilterChange?: (filters: Filter[]) => void;
  onResultSelect?: (result: ResearchResult) => void;
}
```

#### CitationManager

**Status**: Planned

Component for managing research citations.

```typescript
interface CitationManagerProps {
  citations: Citation[];
  onAdd?: (citation: Citation) => void;
  onEdit?: (citation: Citation) => void;
  onDelete?: (id: string) => void;
  format?: 'APA' | 'MLA' | 'Chicago';
}
```

## Component Development Guidelines

### Component Template

Use this template for new components:

```typescript
/**
 * @fileoverview [Component name and purpose]
 * @lastmodified [ISO timestamp]
 *
 * Features: [Key features]
 * Main APIs: [Primary props and methods]
 * Constraints: [Dependencies and limitations]
 * Patterns: [Usage patterns and best practices]
 */

import React from 'react';

/**
 * [Component description]
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ComponentName prop1="value" prop2={value}>
 *   Content
 * </ComponentName>
 * ```
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  // Props destructuring
}) => {
  // Component implementation
  return (
    // JSX
  );
};

export interface ComponentNameProps {
  // Prop definitions with TSDoc
}
```

### Best Practices

1. **Composition over Configuration**: Build small, composable components
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Default Props**: Use default parameters instead of defaultProps
4. **Error Boundaries**: Wrap complex components in error boundaries
5. **Accessibility**: Include ARIA labels and keyboard navigation
6. **Performance**: Use React.memo for expensive re-renders
7. **Testing**: Write unit tests for all components

### Naming Conventions

- **Components**: PascalCase (e.g., `DataTable`)
- **Props Interfaces**: `ComponentNameProps`
- **Event Handlers**: `onEventName` (e.g., `onClick`, `onChange`)
- **Files**: Match component name (e.g., `DataTable.tsx`)
- **Test Files**: `ComponentName.test.tsx`

### File Organization

```
components/ComponentName/
├── ComponentName.tsx       # Component implementation
├── ComponentName.test.tsx  # Unit tests
├── ComponentName.styles.ts # Styled components
├── types.ts                # Type definitions
├── hooks.ts                # Custom hooks
└── index.ts                # Public exports
```

### Styling Approaches

Choose the appropriate styling method:

1. **Material-UI sx prop**: For simple, one-off styles
2. **styled-components**: For complex, reusable styles
3. **CSS modules**: For component-specific styles
4. **Theme system**: For global design tokens

### Accessibility Requirements

All components must meet WCAG 2.1 Level AA standards:

- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus indicators
- ARIA labels and roles

## Testing Guidelines

### Unit Tests

Test component behavior and props:

```typescript
describe('ComponentName', () => {
  it('renders with required props', () => {
    // Test rendering
  });

  it('handles user interactions', () => {
    // Test event handlers
  });

  it('displays error states', () => {
    // Test error handling
  });
});
```

### Integration Tests

Test component interactions and state management:

```typescript
describe('ComponentName integration', () => {
  it('integrates with Redux store', () => {
    // Test Redux integration
  });

  it('calls API on user action', () => {
    // Test API interactions
  });
});
```

## Component Status Key

- **Planned**: Component design in progress
- **In Development**: Implementation underway
- **In Review**: Code review in progress
- **Stable**: Production-ready
- **Deprecated**: Scheduled for removal

## Contributing

When adding new components:

1. Follow the component template above
2. Add comprehensive TSDoc comments
3. Include usage examples
4. Write unit and integration tests
5. Update this catalog with component details
6. Document any new patterns or conventions

## Resources

- [React Documentation](https://react.dev)
- [Material-UI Components](https://mui.com/material-ui/all-components/)
- [React Testing Library](https://testing-library.com/react)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

Last updated: 2025-10-28
