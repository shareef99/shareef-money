import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Minus, Pencil, Plus } from "lucide-react-native";
import type { Location } from "@shareef-money/db/schema";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useArchiveLocation,
} from "../../../queries/use-locations";
import { CategoryFormModal } from "../../../components/category-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";

export default function LocationListScreen() {
  const router = useRouter();
  const { data: locations = [] } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const archiveLocation = useArchiveLocation();

  const [formTarget, setFormTarget] = useState<"add" | Location | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Location | null>(null);

  const handleSubmit = useCallback(
    (values: { name: string }) => {
      if (formTarget === "add") {
        createLocation.mutate(values.name);
      } else if (formTarget) {
        updateLocation.mutate({ id: formTarget.id, name: values.name });
      }
      setFormTarget(null);
    },
    [formTarget, createLocation, updateLocation],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text" />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            Locations
          </Text>
          <Pressable onPress={() => setFormTarget("add")} className="p-2">
            <Plus size={24} className="text-text" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 mt-2">
          {locations.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-text-secondary text-base">
                No locations yet
              </Text>
              <Text className="text-text-muted text-sm mt-1">
                Tap + to add a location
              </Text>
            </View>
          ) : (
            locations.map((location) => (
              <View
                key={location.id}
                className="flex-row items-center px-4 py-3 border-b border-border"
              >
                <Pressable
                  onPress={() => setArchiveTarget(location)}
                  className="mr-3"
                  hitSlop={8}
                >
                  <View className="w-6 h-6 rounded-full bg-error items-center justify-center">
                    <Minus size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Pressable>
                <Text className="text-base text-text flex-1">{location.name}</Text>
                <Pressable
                  onPress={() => setFormTarget(location)}
                  className="p-2"
                  hitSlop={8}
                >
                  <Pencil size={18} className="text-text-secondary" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        <CategoryFormModal
          visible={formTarget !== null}
          title={formTarget === "add" ? "Add Location" : "Edit Location"}
          initialName={
            formTarget && formTarget !== "add" ? formTarget.name : undefined
          }
          onClose={() => setFormTarget(null)}
          onSubmit={handleSubmit}
        />

        <ConfirmModal
          visible={archiveTarget !== null}
          title={`Delete "${archiveTarget?.name ?? ""}"?`}
          message="Your transactions will not be deleted. This location will be archived and hidden from lists."
          confirmLabel="Archive"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            if (archiveTarget) archiveLocation.mutate(archiveTarget.id);
            setArchiveTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
