import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { ArrowLeft, Pencil, Plus } from "lucide-react-native";
import type { Category } from "@shareef-money/db/schema";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useArchiveCategory,
  useReorderCategories,
} from "../../../queries/use-categories";
import { SortableCategoryRow } from "../../../components/sortable-category-row";
import { CategoryFormModal } from "../../../components/category-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";
import { getColors } from "../../../lib/colors";

export default function SubcategoriesScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const params = useLocalSearchParams<{ parentId?: string }>();
  const parentId = params.parentId ? Number(params.parentId) : null;

  const [formTarget, setFormTarget] = useState<"add" | Category | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const archiveCategory = useArchiveCategory();
  const reorderCategories = useReorderCategories();

  const parent = useMemo(
    () => categories.find((c) => c.id === parentId),
    [categories, parentId],
  );

  const subcategories = useMemo(
    () => categories.filter((c) => c.parentId === parentId),
    [categories, parentId],
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <SortableCategoryRow
        category={item}
        onEditPress={() => setFormTarget(item)}
        onDeletePress={() => setArchiveTarget(item)}
      />
    ),
    [],
  );

  const handleSubmit = useCallback(
    (values: { name: string; color: string }) => {
      if (formTarget === "add" && parent) {
        createCategory.mutate({
          ...values,
          type: parent.type as "income" | "expense",
          parentId: parent.id,
        });
      } else if (formTarget && formTarget !== "add") {
        updateCategory.mutate({ id: formTarget.id, payload: values });
      }
      setFormTarget(null);
    },
    [formTarget, parent, createCategory, updateCategory],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            {parent ? `${parent.name} Subcategory` : "Subcategory"}
          </Text>
          {parent && (
            <Pressable onPress={() => setFormTarget(parent)} className="p-2">
              <Pencil size={20} color={c.text} />
            </Pressable>
          )}
          <Pressable onPress={() => setFormTarget("add")} className="p-2">
            <Plus size={24} color={c.text} />
          </Pressable>
        </View>

        <Animated.ScrollView ref={scrollableRef} className="flex-1 mt-2">
          <Sortable.Grid
            columns={1}
            data={subcategories}
            renderItem={renderItem}
            keyExtractor={(item: Category) => String(item.id)}
            customHandle
            scrollableRef={scrollableRef}
            onDragEnd={({ data }: { data: Category[] }) =>
              reorderCategories.mutate(data.map((c) => c.id))
            }
          />
        </Animated.ScrollView>

        <CategoryFormModal
          visible={formTarget !== null}
          title={
            formTarget === "add"
              ? "Add Subcategory"
              : formTarget?.id === parentId
                ? "Edit Category"
                : "Edit Subcategory"
          }
          initialName={
            formTarget && formTarget !== "add" ? formTarget.name : undefined
          }
          initialColor={
            formTarget && formTarget !== "add" ? formTarget.color : undefined
          }
          onClose={() => setFormTarget(null)}
          onSubmit={handleSubmit}
        />

        <ConfirmModal
          visible={archiveTarget !== null}
          title={`Delete "${archiveTarget?.name ?? ""}"?`}
          message="Your transactions will not be deleted. This subcategory will be archived and hidden from lists. If you only want to change the name, use the edit option instead."
          confirmLabel="Archive"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            if (archiveTarget) archiveCategory.mutate(archiveTarget.id);
            setArchiveTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
