import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { ArrowLeft, Plus } from "lucide-react-native";
import type { Category } from "@shareef-money/db/schema";
import {
  useCategories,
  useCreateCategory,
  useArchiveCategory,
  useReorderCategories,
} from "../../../queries/use-categories";
import { SortableCategoryRow } from "../../../components/sortable-category-row";
import { CategoryFormModal } from "../../../components/category-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";
import { getColors } from "../../../lib/colors";

export default function CategoryListScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const params = useLocalSearchParams<{ type?: string }>();
  const type = params.type === "income" ? "income" : "expense";

  const [showAddModal, setShowAddModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const { data: categories = [] } = useCategories(type);
  const createCategory = useCreateCategory();
  const archiveCategory = useArchiveCategory();
  const reorderCategories = useReorderCategories();

  const parents = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <SortableCategoryRow
        category={item}
        onEditPress={() =>
          router.push({
            pathname: "/subcategories",
            params: { parentId: String(item.id) },
          })
        }
        onDeletePress={() => setArchiveTarget(item)}
      />
    ),
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            {type === "income" ? "Income Category" : "Expense Category"}
          </Text>
          <Pressable onPress={() => setShowAddModal(true)} className="p-2">
            <Plus size={24} color={c.text} />
          </Pressable>
        </View>

        <Animated.ScrollView ref={scrollableRef} className="flex-1 mt-2">
          <Sortable.Grid
            columns={1}
            data={parents}
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
          visible={showAddModal}
          title="Add Category"
          onClose={() => setShowAddModal(false)}
          onSubmit={(values) => {
            createCategory.mutate({ ...values, type });
            setShowAddModal(false);
          }}
        />

        <ConfirmModal
          visible={archiveTarget !== null}
          title={`Delete "${archiveTarget?.name ?? ""}"?`}
          message="Your transactions will not be deleted. This category and its subcategories will be archived and hidden from lists. If you only want to change the name, use the edit option instead."
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
