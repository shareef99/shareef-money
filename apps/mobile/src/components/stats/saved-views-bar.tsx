import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Bookmark, Plus, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useStatsFilter } from "./stats-filter-context";
import { useSavedViews, useSaveView, useDeleteView } from "../../queries/use-stats-views";
import { fromStored } from "../../lib/stats-filter";
import { getColors } from "../../lib/colors";
import { useKeyboardHeight } from "../../lib/use-keyboard-height";

// Save the current filter as a named view, and re-apply / delete saved ones.
export function SavedViewsBar() {
  const c = getColors(useColorScheme().colorScheme);
  const { filter, setFilter } = useStatsFilter();
  const { data: views = [] } = useSavedViews();
  const saveView = useSaveView();
  const deleteView = useDeleteView();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const kbHeight = useKeyboardHeight();

  return (
    <View className="pb-1">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              setName("");
              setNaming(true);
            }}
            className="flex-row items-center px-3 py-1.5 rounded-full border border-dashed border-border"
          >
            <Plus size={13} color={c.textSecondary} />
            <Text className="text-xs text-text-secondary ml-1">Save view</Text>
          </Pressable>
          {views.map((v) => (
            <View
              key={v.id}
              className="flex-row items-center px-3 py-1.5 rounded-full bg-card border border-border"
            >
              <Bookmark size={12} color={c.primary} />
              <Pressable onPress={() => setFilter(fromStored(v.filter))}>
                <Text className="text-xs text-text mx-1.5">{v.name}</Text>
              </Pressable>
              <Pressable onPress={() => deleteView.mutate(v.id)} hitSlop={6}>
                <X size={12} color={c.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={naming} transparent animationType="fade" onRequestClose={() => setNaming(false)}>
        <Pressable
          className="flex-1 bg-black/60 items-center justify-center px-8"
          style={{ paddingBottom: kbHeight }}
          onPress={() => setNaming(false)}
        >
          <Pressable className="w-full bg-card rounded-2xl p-5" onPress={() => {}}>
            <Text className="text-base font-semibold text-text mb-3">Name this view</Text>
            <TextInput
              autoFocus
              value={name}
              onChangeText={setName}
              placeholder="e.g. Food this year"
              placeholderTextColor={c.textMuted}
              className="bg-surface rounded-lg px-3 py-2.5 text-text mb-4"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setNaming(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface items-center"
              >
                <Text className="text-text-secondary font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                disabled={!name.trim()}
                onPress={() => {
                  saveView.mutate({ name: name.trim(), filter });
                  setNaming(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary items-center"
                style={{ opacity: name.trim() ? 1 : 0.5 }}
              >
                <Text className="text-primary-foreground font-medium">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
