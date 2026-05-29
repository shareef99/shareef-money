import { z } from "zod";

const syncableTableNames = [
  "accounts",
  "categories",
  "contacts",
  "locations",
  "transactions",
  "transaction_contacts",
  "settings",
] as const;

const syncChangeSchema = z
  .object({
    table: z.enum(syncableTableNames),
    action: z.enum(["upsert", "delete"]),
    data: z.record(z.unknown()),
    updatedAt: z.number().int().positive(),
  })
  .strict();

export const syncPushSchema = z
  .object({
    changes: z.array(syncChangeSchema),
    deviceId: z.string().min(1),
  })
  .strict();
export type SyncPushInput = z.infer<typeof syncPushSchema>;

export const syncPullSchema = z
  .object({
    lastSyncAt: z.number().int().min(0),
    tables: z.array(z.enum(syncableTableNames)).optional(),
  })
  .strict();
export type SyncPullInput = z.infer<typeof syncPullSchema>;

export const syncAckSchema = z
  .object({
    deviceId: z.string().min(1),
    syncedAt: z.number().int().positive(),
  })
  .strict();
export type SyncAckInput = z.infer<typeof syncAckSchema>;
