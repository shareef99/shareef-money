import { createContext, useContext, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "../db/client";
import migrations from "../db/migrations";

type DatabaseContextValue = {
  db: typeof db;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-error text-base font-semibold mb-2">
          Database Error
        </Text>
        <Text className="text-text-secondary text-sm text-center">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <DatabaseContext value={{ db }}>
      {children}
    </DatabaseContext>
  );
}
