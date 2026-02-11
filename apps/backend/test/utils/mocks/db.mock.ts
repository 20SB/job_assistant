import { vi } from "vitest";

/**
 * Chainable mock helpers for Drizzle ORM's `db` object.
 *
 * Usage:
 *   vi.mock("../../src/db/index.js");
 *   import { db } from "../../src/db/index.js";
 *   const mDb = db as unknown as MockDb;
 *   mDb.select.mockReturnValue(mockSelectChain([row]));
 */

interface ChainableQuery {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => void) => void;
}

export function mockSelectChain(data: unknown[] = []): ChainableQuery {
  const chain: ChainableQuery = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    groupBy: vi.fn(),
    then: (resolve) => resolve(data),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  return chain;
}

interface InsertChain {
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  onConflictDoNothing: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => void) => void;
}

export function mockInsertChain(data: unknown[] = []): InsertChain {
  const chain: InsertChain = {
    values: vi.fn(),
    returning: vi.fn(),
    onConflictDoNothing: vi.fn(),
    then: (resolve) => resolve(data),
  };
  chain.values.mockReturnValue(chain);
  chain.returning.mockReturnValue(chain);
  chain.onConflictDoNothing.mockReturnValue(chain);
  return chain;
}

interface UpdateChain {
  set: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => void) => void;
}

export function mockUpdateChain(data: unknown[] = []): UpdateChain {
  const chain: UpdateChain = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
    then: (resolve) => resolve(data),
  };
  chain.set.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.returning.mockReturnValue(chain);
  return chain;
}

interface DeleteChain {
  where: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => void) => void;
}

export function mockDeleteChain(data: unknown[] = []): DeleteChain {
  const chain: DeleteChain = {
    where: vi.fn(),
    returning: vi.fn(),
    then: (resolve) => resolve(data),
  };
  chain.where.mockReturnValue(chain);
  chain.returning.mockReturnValue(chain);
  return chain;
}

export interface MockDb {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  query: Record<string, { findFirst: ReturnType<typeof vi.fn> }>;
}

/**
 * Creates a fully mocked `db` object for use with `vi.mock`.
 */
export function createMockDb(): MockDb {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    query: {
      users: { findFirst: vi.fn() },
    },
  };
}
