import { PrismaClient } from "@prisma/client";

/**
 * Creates a Prisma client extension that auto-injects organizationId
 * into all queries for multi-tenant data isolation.
 */
export function tenantPrisma(prisma: PrismaClient, organizationId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && "organizationId" in result && result.organizationId !== organizationId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, organizationId } as typeof args.data;
          return query(args);
        },
        async createMany({ args, query }) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d: Record<string, unknown>) => ({ ...d, organizationId })) as typeof args.data;
          } else {
            args.data = { ...args.data, organizationId } as typeof args.data;
          }
          return query(args);
        },
        async update({ args, query }) {
          // Fetch record first and verify tenant ownership
          const result = await query(args);
          if (result && "organizationId" in result && result.organizationId !== organizationId) {
            throw new Error("Tenant isolation violation: record does not belong to this organization");
          }
          return result;
        },
        async upsert({ args, query }) {
          args.create = { ...args.create, organizationId } as typeof args.create;
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async delete({ args, query }) {
          // Fetch record first and verify tenant ownership
          const result = await query(args);
          if (result && "organizationId" in result && result.organizationId !== organizationId) {
            throw new Error("Tenant isolation violation: cannot delete record from another organization");
          }
          return result;
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async aggregate({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async groupBy({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantPrisma>;
