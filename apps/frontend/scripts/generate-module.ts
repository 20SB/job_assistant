#!/usr/bin/env tsx
/**
 * Module Generator Script
 *
 * Scaffolds a new feature module with all necessary files and structure.
 *
 * Usage:
 *   npm run generate:module -- --name auth
 *   npm run generate:module -- --name cv --with-store
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModuleOptions {
  name: string;
  withStore?: boolean;
  withTests?: boolean;
}

function parseArgs(): ModuleOptions {
  const args = process.argv.slice(2);
  const options: ModuleOptions = {
    name: '',
    withStore: false,
    withTests: true,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i++;
    } else if (args[i] === '--with-store') {
      options.withStore = true;
    } else if (args[i] === '--no-tests') {
      options.withTests = false;
    }
  }

  if (!options.name) {
    console.error('❌ Error: Module name is required');
    console.log('Usage: npm run generate:module -- --name [module-name]');
    process.exit(1);
  }

  return options;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generateModule(options: ModuleOptions): void {
  const { name, withStore, withTests } = options;
  const modulePath = path.join(__dirname, '../src/modules', name);
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);

  console.log(`\n🚀 Generating module: ${name}\n`);

  // Check if module already exists
  if (fs.existsSync(modulePath)) {
    console.error(`❌ Error: Module "${name}" already exists at ${modulePath}`);
    process.exit(1);
  }

  // Create directory structure
  const dirs = [
    `${modulePath}/components`,
    `${modulePath}/hooks`,
    `${modulePath}/api`,
    `${modulePath}/types`,
    `${modulePath}/utils`,
    `${modulePath}/constants`,
  ];

  if (withStore) {
    dirs.push(`${modulePath}/store`);
  }

  dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir.replace(modulePath, '.')}`);
  });

  // Generate files
  generateIndexFile(modulePath, pascalName, camelName, withStore ?? false);
  generateReadme(modulePath, name, pascalName);
  generateClaudeMd(modulePath, name, pascalName);
  generateTypesFile(modulePath, pascalName, camelName);
  generateApiFile(modulePath, pascalName, camelName);
  generateHookFile(modulePath, pascalName, camelName);
  generatePageComponent(modulePath, pascalName, camelName);
  generateConstants(modulePath, name);

  if (withStore) {
    generateStoreFile(modulePath, pascalName, camelName);
  }

  if (withTests) {
    generateTestFiles(modulePath, pascalName, camelName);
  }

  console.log(`\n✅ Module "${name}" generated successfully!`);
  console.log(`\n📁 Location: src/modules/${name}/`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Update src/modules/${name}/README.md with module details`);
  console.log(`   2. Update src/modules/${name}/CLAUDE.md with AI context`);
  console.log(`   3. Implement components in src/modules/${name}/components/`);
  console.log(`   4. Add route in app/(dashboard)/${name}/page.tsx:\n`);
  console.log(`      import { ${pascalName}Page } from '@/modules/${name}';`);
  console.log(`      export default ${pascalName}Page;\n`);
}

function generateIndexFile(modulePath: string, pascalName: string, camelName: string, withStore: boolean): void {
  const content = `/**
 * ${pascalName} Module - Public API
 *
 * This file defines what is exported from the module.
 * Only export what needs to be used outside the module.
 */

// Components
export { ${pascalName}Page } from './components/${pascalName}Page';

// Hooks
export { use${pascalName} } from './hooks/use${pascalName}';

// API Client
export { ${camelName}Api } from './api/${camelName}.api';

// Types (re-export all)
export type * from './types';

// Constants
export * from './constants/${camelName}.constants';
${withStore ? `\n// Store\nexport { use${pascalName}Store } from './store/${camelName}.store';` : ''}
`;

  fs.writeFileSync(path.join(modulePath, 'index.ts'), content);
  console.log(`✅ Created index.ts`);
}

function generateReadme(modulePath: string, name: string, pascalName: string): void {
  const content = `# ${pascalName} Module

> [Brief one-line description]

## Purpose

[Detailed explanation of the module's purpose]

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

\`\`\`typescript
import { ${pascalName}Page } from '@/modules/${name}';

// In app/(dashboard)/${name}/page.tsx
export default ${pascalName}Page;
\`\`\`

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | \`/api/${name}\` | List items |
| POST | \`/api/${name}\` | Create item |

## Development

\`\`\`bash
npm test -- --testPathPattern=modules/${name}
\`\`\`

---

**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(path.join(modulePath, 'README.md'), content);
  console.log(`✅ Created README.md`);
}

function generateClaudeMd(modulePath: string, name: string, pascalName: string): void {
  const content = `# ${pascalName} Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

\`\`\`typescript
export { ${pascalName}Page } from './components/${pascalName}Page';
export { use${pascalName} } from './hooks/use${pascalName}';
export { ${name}Api } from './api/${name}.api';
export type * from './types';
\`\`\`

## Key Files

- \`components/${pascalName}Page/${pascalName}Page.tsx\` - Main page component
- \`hooks/use${pascalName}.ts\` - State management hook
- \`api/${name}.api.ts\` - API client

## Dependencies

### External
- List external packages used

### Internal
- \`@/core/api\` - API client
- \`@/core/auth\` - Authentication
- \`@/ui\` - UI components

## API Calls

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | \`/api/${name}\` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** \`apps/backend/src/modules/${name}/\`
**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(path.join(modulePath, 'CLAUDE.md'), content);
  console.log(`✅ Created CLAUDE.md`);
}

function generateTypesFile(modulePath: string, pascalName: string, camelName: string): void {
  const typesContent = `import { z } from 'zod';

/**
 * ${pascalName} type definition
 */
export interface ${pascalName} {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating ${pascalName}
 */
export interface ${pascalName}FormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface ${pascalName}ListResponse {
  items: ${pascalName}[];
  total: number;
  page: number;
  limit: number;
}
`;

  const schemasContent = `import { z } from 'zod';

/**
 * Zod schema for ${pascalName}
 * Used for runtime validation of API responses
 */
export const ${camelName}Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Zod schema for form data
 */
export const ${camelName}FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
`;

  fs.writeFileSync(path.join(modulePath, 'types', `${camelName}.types.ts`), typesContent);
  fs.writeFileSync(path.join(modulePath, 'types', `${camelName}.schemas.ts`), schemasContent);
  fs.writeFileSync(path.join(modulePath, 'types', 'index.ts'), `export * from './${camelName}.types';\nexport * from './${camelName}.schemas';\n`);
  console.log(`✅ Created types/`);
}

function generateApiFile(modulePath: string, pascalName: string, camelName: string): void {
  const content = `import { fetchApi } from '@/core/api';
import type { ${pascalName}, ${pascalName}FormData, ${pascalName}ListResponse } from '../types';

/**
 * API client for ${pascalName} module
 */
export const ${camelName}Api = {
  /**
   * Fetch all items
   */
  list: (page = 1, limit = 20, token: string) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    return fetchApi<{ status: string; data: ${pascalName}ListResponse }>(
      \`/api/${camelName}?\${params.toString()}\`,
      {
        method: 'GET',
        token,
      }
    );
  },

  /**
   * Fetch single item by ID
   */
  getById: (id: string, token: string) =>
    fetchApi<{ status: string; data: ${pascalName} }>(\`/api/${camelName}/\${id}\`, {
      method: 'GET',
      token,
    }),

  /**
   * Create new item
   */
  create: (data: ${pascalName}FormData, token: string) =>
    fetchApi<{ status: string; data: ${pascalName} }>(\`/api/${camelName}\`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  /**
   * Update existing item
   */
  update: (id: string, data: Partial<${pascalName}FormData>, token: string) =>
    fetchApi<{ status: string; data: ${pascalName} }>(\`/api/${camelName}/\${id}\`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  /**
   * Delete item
   */
  delete: (id: string, token: string) =>
    fetchApi<{ status: string; data: { message: string } }>(\`/api/${camelName}/\${id}\`, {
      method: 'DELETE',
      token,
    }),
};
`;

  fs.writeFileSync(path.join(modulePath, 'api', `${camelName}.api.ts`), content);
  fs.writeFileSync(path.join(modulePath, 'api', 'index.ts'), `export * from './${camelName}.api';\n`);
  console.log(`✅ Created api/`);
}

function generateHookFile(modulePath: string, pascalName: string, camelName: string): void {
  const content = `import { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth';
import { ${camelName}Api } from '../api/${camelName}.api';
import { toast } from 'sonner';
import type { ${pascalName}, ${pascalName}FormData } from '../types';

/**
 * Hook to manage ${pascalName} state and operations
 */
export function use${pascalName}(id?: string) {
  const { token } = useAuth();
  const [data, setData] = useState<${pascalName} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && token) {
      load();
    }
  }, [id, token]);

  const load = async () => {
    if (!id || !token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await ${camelName}Api.getById(id, token);
      setData(response.data);
    } catch (err: any) {
      const message = err.message || 'Failed to load data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const create = async (formData: ${pascalName}FormData) => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await ${camelName}Api.create(formData, token);
      setData(response.data);
      toast.success('Created successfully');
      return response.data;
    } catch (err: any) {
      const message = err.message || 'Failed to create';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (formData: Partial<${pascalName}FormData>) => {
    if (!id || !token) {
      toast.error('Invalid operation');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await ${camelName}Api.update(id, formData, token);
      setData(response.data);
      toast.success('Updated successfully');
      return response.data;
    } catch (err: any) {
      const message = err.message || 'Failed to update';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!id || !token) {
      toast.error('Invalid operation');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await ${camelName}Api.delete(id, token);
      setData(null);
      toast.success('Deleted successfully');
    } catch (err: any) {
      const message = err.message || 'Failed to delete';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    create,
    update,
    delete: remove,
    reload: load,
  };
}
`;

  fs.writeFileSync(path.join(modulePath, 'hooks', `use${pascalName}.ts`), content);
  fs.writeFileSync(path.join(modulePath, 'hooks', 'index.ts'), `export * from './use${pascalName}';\n`);
  console.log(`✅ Created hooks/`);
}

function generatePageComponent(modulePath: string, pascalName: string, camelName: string): void {
  const content = `"use client";

import { use${pascalName} } from '../hooks/use${pascalName}';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Loader2 } from 'lucide-react';

/**
 * ${pascalName} Page Component
 *
 * Main entry point for the ${camelName} feature.
 */
export function ${pascalName}Page() {
  const { data, loading, error } = use${pascalName}();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          ${pascalName}
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your ${camelName} here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>${pascalName} Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            TODO: Implement ${pascalName} content
          </p>
          <div className="mt-4">
            <Button>Get Started</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

  fs.mkdirSync(path.join(modulePath, 'components', `${pascalName}Page`), { recursive: true });
  fs.writeFileSync(path.join(modulePath, 'components', `${pascalName}Page`, `${pascalName}Page.tsx`), content);
  fs.writeFileSync(path.join(modulePath, 'components', `${pascalName}Page`, 'index.ts'), `export { ${pascalName}Page } from './${pascalName}Page';\n`);
  fs.writeFileSync(path.join(modulePath, 'components', 'index.ts'), `export * from './${pascalName}Page';\n`);
  console.log(`✅ Created components/`);
}

function generateConstants(modulePath: string, name: string): void {
  const content = `/**
 * Constants for ${name} module
 */

export const ${name.toUpperCase()}_ROUTES = {
  LIST: '/${name}',
  DETAIL: (id: string) => \`/${name}/\${id}\`,
  CREATE: '/${name}/new',
  EDIT: (id: string) => \`/${name}/\${id}/edit\`,
} as const;

export const ${name.toUpperCase()}_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
`;

  fs.writeFileSync(path.join(modulePath, 'constants', `${name}.constants.ts`), content);
  console.log(`✅ Created constants/`);
}

function generateStoreFile(modulePath: string, pascalName: string, camelName: string): void {
  const content = `import { create } from 'zustand';
import type { ${pascalName} } from '../types';

/**
 * Zustand store for ${pascalName} module
 * Only use if you need global state management.
 */
interface ${pascalName}Store {
  items: ${pascalName}[];
  selectedId: string | null;
  setItems: (items: ${pascalName}[]) => void;
  setSelectedId: (id: string | null) => void;
  addItem: (item: ${pascalName}) => void;
  updateItem: (id: string, updates: Partial<${pascalName}>) => void;
  removeItem: (id: string) => void;
}

export const use${pascalName}Store = create<${pascalName}Store>((set) => ({
  items: [],
  selectedId: null,

  setItems: (items) => set({ items }),

  setSelectedId: (id) => set({ selectedId: id }),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
}));
`;

  fs.writeFileSync(path.join(modulePath, 'store', `${camelName}.store.ts`), content);
  fs.writeFileSync(path.join(modulePath, 'store', 'index.ts'), `export * from './${camelName}.store';\n`);
  console.log(`✅ Created store/`);
}

function generateTestFiles(modulePath: string, pascalName: string, camelName: string): void {
  const hookTest = `import { renderHook, waitFor } from '@testing-library/react';
import { use${pascalName} } from './use${pascalName}';

// Mock dependencies
jest.mock('@/core/auth', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}));

jest.mock('../api/${camelName}.api', () => ({
  ${camelName}Api: {
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('use${pascalName}', () => {
  it('should load data on mount', async () => {
    const { result } = renderHook(() => use${pascalName}('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add assertions
  });

  // Add more tests...
});
`;

  const componentTest = `import { render, screen } from '@testing-library/react';
import { ${pascalName}Page } from './${pascalName}Page';

// Mock dependencies
jest.mock('../../hooks/use${pascalName}', () => ({
  use${pascalName}: () => ({
    data: null,
    loading: false,
    error: null,
  }),
}));

describe('${pascalName}Page', () => {
  it('should render without crashing', () => {
    render(<${pascalName}Page />);
    expect(screen.getByText('${pascalName}')).toBeInTheDocument();
  });

  // Add more tests...
});
`;

  fs.writeFileSync(path.join(modulePath, 'hooks', `use${pascalName}.test.ts`), hookTest);
  fs.writeFileSync(path.join(modulePath, 'components', `${pascalName}Page`, `${pascalName}Page.test.tsx`), componentTest);
  console.log(`✅ Created test files`);
}

// Run generator
const options = parseArgs();
generateModule(options);
