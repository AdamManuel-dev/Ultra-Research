# Contributing to Deep Research Cockpit

> **Last Updated**: 2025-10-28
> **Status**: Pre-Alpha - Foundation Phase
> **We welcome contributions!** 🎉

Thank you for your interest in contributing to Deep Research Cockpit. This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for everyone. We pledge to:

- Be respectful and inclusive
- Welcome diverse perspectives and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

### Enforcement

Report unacceptable behavior to [maintainers@example.com](mailto:maintainers@example.com). All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Read the documentation**:
   - [README.md](README.md) - Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [Getting Started Guide](docs/guides/GETTING_STARTED.md) - Setup
   - [Development Guide](docs/guides/DEVELOPMENT.md) - Workflow

2. **Set up development environment**:
   - Node.js 18+
   - Docker and Docker Compose
   - Git
   - Code editor (VS Code recommended)

3. **Fork and clone the repository**:
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/deep-research-cockpit.git
   cd deep-research-cockpit

   # Add upstream remote
   git remote add upstream https://github.com/original/deep-research-cockpit.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start services and verify setup**:
   ```bash
   npm run docker:up
   npm run dev

   # Visit http://localhost:3000 to verify
   ```

---

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 1. Code Contributions
- **Bug fixes**: Fix reported issues
- **Features**: Implement new functionality
- **Refactoring**: Improve code quality
- **Performance**: Optimize slow operations
- **Tests**: Add or improve test coverage

#### 2. Documentation
- **Guides**: Improve or create new guides
- **API docs**: Document APIs and interfaces
- **Examples**: Add usage examples
- **Translations**: Translate documentation (future)

#### 3. Testing & QA
- **Bug reports**: Report issues with details
- **Feature testing**: Test new features
- **Regression testing**: Verify fixes work
- **Usability feedback**: Suggest UX improvements

#### 4. Design & UX
- **UI improvements**: Enhance user interface
- **UX feedback**: Suggest workflow improvements
- **Mockups**: Create design proposals
- **Accessibility**: Improve accessibility

### Finding Issues to Work On

**Good first issues**:
- Look for [`good first issue`](https://github.com/yourusername/deep-research-cockpit/labels/good%20first%20issue) label
- Simple bug fixes
- Documentation improvements
- Test additions

**Help wanted**:
- Check [`help wanted`](https://github.com/yourusername/deep-research-cockpit/labels/help%20wanted) label
- Feature implementations
- Performance optimizations
- Integration work

**Current priorities**:
- See [Roadmap](README.md#roadmap--status) for current phase
- Check [Project Board](https://github.com/yourusername/deep-research-cockpit/projects) for sprint tasks

---

## Development Process

### 1. Create an Issue First

Before starting work, **create or comment on an issue**:

1. **Search existing issues** to avoid duplicates
2. **Describe the problem** or feature clearly
3. **Wait for approval** from maintainers (for features)
4. **Self-assign** the issue when starting work

**Example issue**:
```markdown
## Problem
Event streaming stops working after 1000 events due to memory leak

## Reproduction
1. Start a research session
2. Let it run for >1000 events
3. Observe memory usage growing unbounded

## Proposed Solution
Implement event buffer limit with circular buffer

## Environment
- OS: macOS 14.0
- Node: 18.17.0
- Browser: Chrome 120
```

### 2. Create a Branch

Create a descriptive branch from `main`:

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/event-buffer-limit

# Or for bug fixes
git checkout -b fix/event-memory-leak

# Or for docs
git checkout -b docs/improve-setup-guide
```

**Branch naming**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### 3. Make Changes

Follow our [Development Guide](docs/guides/DEVELOPMENT.md):

1. **Write code** following [coding standards](#coding-standards)
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Run checks locally**:
   ```bash
   npm run type-check
   npm run lint
   npm run test
   ```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(backend): add event buffer limit to prevent memory leaks

Implements circular buffer with configurable max size (default 10000).
Old events are evicted when limit is reached.

Closes #123"
```

**Commit message format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

**Scopes**:
- `backend`: Backend code
- `frontend`: Frontend code
- `shared`: Shared package
- `docs`: Documentation
- `ci`: CI/CD changes

### 5. Push Changes

```bash
# Push to your fork
git push origin feature/event-buffer-limit
```

---

## Pull Request Process

### 1. Create Pull Request

1. **Navigate to your fork** on GitHub
2. **Click "New Pull Request"**
3. **Select base**: `upstream/main` ← `your-fork/feature-branch`
4. **Fill out PR template**:

```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex code
- [x] Documentation updated
- [x] Tests added/updated
- [x] All checks passing
```

### 2. Code Review

**What to expect**:
- Maintainers will review within 2-3 business days
- Feedback may request changes
- Multiple review rounds may be needed
- Be patient and responsive to feedback

**Responding to feedback**:
```bash
# Make requested changes
# Commit changes
git add .
git commit -m "refactor: address code review feedback"

# Push updates
git push origin feature/event-buffer-limit

# PR automatically updates
```

### 3. Merging

**Requirements for merge**:
- ✅ All CI checks pass
- ✅ At least one maintainer approval
- ✅ No unresolved comments
- ✅ Up to date with main branch
- ✅ Tests cover new code

**Merge process**:
1. Maintainer will merge when ready
2. Your branch will be deleted
3. Changes appear in `main`
4. You'll be credited as contributor! 🎉

**After merge**:
```bash
# Update your local main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/event-buffer-limit
```

---

## Coding Standards

### TypeScript Style

**Follow existing patterns**:
- Strict TypeScript (`strict: true`)
- No `any` types
- Explicit return types for functions
- Interfaces for object shapes
- Generics for reusable code

**Example**:
```typescript
/**
 * @fileoverview Event buffer with size limit
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Circular buffer, configurable size, event eviction
 * Main APIs: EventBuffer class with push(), get(), clear()
 * Constraints: Max size enforced, old events evicted
 * Patterns: FIFO eviction when buffer full
 */

interface EventBufferOptions {
  maxSize: number;
}

export class EventBuffer<T> {
  private buffer: T[] = [];
  private readonly maxSize: number;

  constructor(options: EventBufferOptions) {
    this.maxSize = options.maxSize;
  }

  public push(event: T): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();  // Remove oldest
    }
    this.buffer.push(event);
  }

  public get(): ReadonlyArray<T> {
    return this.buffer;
  }

  public clear(): void {
    this.buffer = [];
  }
}
```

### ESLint & Prettier

**Automatic formatting**:
- ESLint enforces code quality rules
- Prettier handles formatting
- Pre-commit hooks run checks
- Use `npm run lint:fix` to auto-fix

**VS Code setup**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Testing Requirements

**All new code needs tests**:
- Unit tests for business logic
- Integration tests for APIs
- Component tests for UI

**Coverage targets**:
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

See [Testing Guide](docs/guides/TESTING.md) for details.

---

## Documentation

### Documentation Requirements

**New features must include**:
1. **Code comments**: JSDoc for public APIs
2. **Guide updates**: Update relevant guides
3. **API docs**: Document new endpoints
4. **Examples**: Add usage examples
5. **README updates**: Update if user-facing

### Documentation Style

**Writing guidelines**:
- Use clear, concise language
- Include code examples
- Add diagrams when helpful
- Keep formatting consistent
- Update lastmodified dates

**File headers**:
```markdown
# Title

> **Last Updated**: 2025-10-28
> **Target Audience**: Developers, Users
> **Prerequisites**: Links to required reading
```

---

## Community

### Communication Channels

**GitHub**:
- [Issues](https://github.com/yourusername/deep-research-cockpit/issues) - Bug reports, feature requests
- [Discussions](https://github.com/yourusername/deep-research-cockpit/discussions) - Questions, ideas
- [Pull Requests](https://github.com/yourusername/deep-research-cockpit/pulls) - Code contributions

**Discord** (Coming soon):
- Real-time chat
- Help and support
- Community discussions

### Getting Help

**If you're stuck**:
1. Check existing documentation
2. Search GitHub issues
3. Ask in GitHub Discussions
4. Reach out to maintainers

**If you found a bug**:
1. Search existing issues
2. Create detailed bug report
3. Include reproduction steps
4. Provide environment details

---

## Recognition

### Contributors

All contributors are recognized in:
- GitHub contributors page
- Release notes
- Project README
- Community highlights

### Maintainers

Current maintainers:
- @maintainer1 - Core maintainer
- @maintainer2 - Documentation lead
- @maintainer3 - Testing lead

Interested in becoming a maintainer? Contact us!

---

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

---

## Questions?

**Have questions about contributing?**

- Read [Getting Started Guide](docs/guides/GETTING_STARTED.md)
- Ask in [GitHub Discussions](https://github.com/yourusername/deep-research-cockpit/discussions)
- Email maintainers at [maintainers@example.com](mailto:maintainers@example.com)

---

**Thank you for contributing to Deep Research Cockpit! 🚀**

Your contributions help make AI research more transparent, verifiable, and steerable for everyone.
