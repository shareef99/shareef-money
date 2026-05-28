import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@shareef-money/db/schema";

const expo = openDatabaseSync("shareef-money.db");

export const db = drizzle(expo, { schema });
