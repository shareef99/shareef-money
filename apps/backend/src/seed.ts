import { eq } from "drizzle-orm";
import { usersTable } from "@shareef-money/db/schema";
import { db } from "./db.js";
import { env } from "./env.js";
import * as authService from "./routes/auth/auth.service.js";
import * as accountsService from "./routes/accounts/accounts.service.js";
import * as categoriesService from "./routes/categories/categories.service.js";
import * as transactionsService from "./routes/transactions/transactions.service.js";

// Populates the configured database with a demo user + sample data so the dev
// environment has something to work with. Edit the values below to inject
// whatever you need. Run against the DEV database only:
//   DATABASE_URL=libsql://…dev… DATABASE_AUTH_TOKEN=… pnpm --filter backend db:seed
//
// Guard against pointing it at production by accident.
if (env.NODE_ENV === "production") {
  console.error(
    "Refusing to seed: NODE_ENV=production. Point DATABASE_URL at the dev database and unset NODE_ENV (or set it to development).",
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo@dev.local";
const DEMO_PASSWORD = "demo12345";

console.log("Seeding database:", env.DATABASE_URL);

let user = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL)).get();
if (!user) {
  await authService.register(db, { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: "Demo User" });
  user = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL)).get();
  console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} else {
  console.log(`Demo user already exists: ${DEMO_EMAIL}`);
}

const userId = user!.id;
const accounts = await accountsService.list(db, userId);
const categories = await categoriesService.list(db, userId);
const accountId = accounts[0]!.id;
const expenseCats = categories.filter((c) => c.type === "expense");
const incomeCats = categories.filter((c) => c.type === "income");

// A month of sample activity: a daily expense plus a weekly income.
const DAY = 86_400_000;
const now = Date.now();
let count = 0;
for (let i = 0; i < 30; i += 1) {
  const date = now - i * DAY;
  const expenseCat = expenseCats[i % expenseCats.length]!;
  await transactionsService.create(db, userId, {
    type: "expense",
    amount: 1000 + ((i * 137) % 9000),
    date,
    accountId,
    categoryId: expenseCat.id,
    note: "seed",
  });
  count += 1;

  if (i % 7 === 0 && incomeCats.length) {
    const incomeCat = incomeCats[i % incomeCats.length]!;
    await transactionsService.create(db, userId, {
      type: "income",
      amount: 5_000_00,
      date,
      accountId,
      categoryId: incomeCat.id,
      note: "seed salary",
    });
    count += 1;
  }
}

console.log(`Seeded ${count} sample transactions for ${DEMO_EMAIL}.`);
process.exit(0);
