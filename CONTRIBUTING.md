# Contributing to PhotoNamer

Thank you for your interest in contributing to **PhotoNamer**! 🎉

We welcome contributions of all kinds — bug reports, feature suggestions, documentation improvements, and code contributions.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Priority Contribution Areas](#priority-contribution-areas)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## How to Report a Bug

1. **Search existing issues** first to avoid duplicates.
2. If the issue doesn't exist, [open a new issue](https://github.com/your-username/photo-renamer_nextjs/issues/new) with:
   - A clear, descriptive title
   - Steps to reproduce the problem
   - Expected behavior vs. actual behavior
   - Your environment (OS, browser, Node.js version)
   - Screenshots or error logs if applicable

> 🔐 **Security vulnerabilities** must be reported privately. See [SECURITY.md](SECURITY.md).

---

## How to Request a Feature

1. [Open a feature request issue](https://github.com/your-username/photo-renamer_nextjs/issues/new) with the label `enhancement`.
2. Describe the problem the feature solves and how it should work.
3. Include mockups or examples if possible.

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A [Google AI API key](https://aistudio.google.com/app/apikey)

### Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/photo-renamer_nextjs.git
cd photo-renamer_nextjs

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start the development server
npm run dev
# App runs at http://localhost:9002
```

### Verify your setup

```bash
npm run typecheck   # Should report no errors
npm run lint        # Should report no errors
```

---

## Pull Request Process

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following the [Coding Standards](#coding-standards) below.

3. **Run checks** before pushing:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

4. **Commit** using clear messages (Conventional Commits format):
   ```
   feat: add bulk photo download as ZIP
   fix: correct duplicate name counter starting at wrong index
   docs: update API.md with new delete endpoint
   refactor: extract photo validation logic into utility
   ```

5. **Open a Pull Request** against the `main` branch with:
   - A descriptive title
   - A summary of what changed and why
   - Reference to any related issues (e.g., `Closes #42`)
   - Screenshots for UI changes

6. **Respond to review feedback** promptly. PRs with no activity for 2 weeks may be closed.

---

## Coding Standards

### TypeScript
- Use TypeScript strictly — no `any` types
- Define explicit return types for public functions
- Use Zod schemas for all external input validation

### React / Next.js
- Use **Pages Router** (`src/pages/`) — not App Router
- Client-side state: React hooks only
- Server-side logic: API routes in `src/pages/api/`
- All API inputs must be validated with Zod on the server

### Styling
- Use Tailwind CSS utility classes
- Follow the existing design tokens in `globals.css`
- Use shadcn/ui components from `src/components/ui/` before creating new ones

### File Naming
- React components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts` or `use-name.ts`
- API routes: `kebab-case.ts`

### Accessibility
- Use semantic HTML elements
- Add `aria-label` and `sr-only` text for icon-only buttons
- Ensure keyboard navigation works for all interactive elements

---

## Priority Contribution Areas

The following are high-priority improvements we'd love help with:

### 🔥 High Priority
- **Persistent storage**: Replace the in-memory `photo-store.ts` with Firebase Firestore + Firebase Storage
- **Session-based authentication**: Replace the stateless password check with proper session cookies
- **Pagination**: Add pagination to the admin dashboard (currently loads all photos at once)

### 🟡 Medium Priority
- **Bulk download**: Allow admins to download all photos as a ZIP file
- **Search & filter**: Add search by student name in the admin view
- **Upload progress**: Show a progress bar for large file uploads

### 🟢 Good First Issues
- Add unit tests using Vitest or Jest
- Improve error messages across the app
- Add ARIA improvements to existing components

---

## Questions?

Feel free to open an issue with the label `question` if you're unsure about anything. We're happy to help!
