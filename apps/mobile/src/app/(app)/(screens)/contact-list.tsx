import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Minus, Pencil, Plus } from "lucide-react-native";
import type { Contact } from "@shareef-money/db/schema";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useArchiveContact,
} from "../../../queries/use-contacts";
import { CategoryFormModal } from "../../../components/category-form-modal";
import { ConfirmModal } from "../../../components/confirm-modal";

export default function ContactListScreen() {
  const router = useRouter();
  const { data: contacts = [] } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const archiveContact = useArchiveContact();

  const [formTarget, setFormTarget] = useState<"add" | Contact | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Contact | null>(null);

  const handleSubmit = useCallback(
    (values: { name: string }) => {
      if (formTarget === "add") {
        createContact.mutate(values.name);
      } else if (formTarget) {
        updateContact.mutate({ id: formTarget.id, name: values.name });
      }
      setFormTarget(null);
    },
    [formTarget, createContact, updateContact],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text" />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            Contacts
          </Text>
          <Pressable onPress={() => setFormTarget("add")} className="p-2">
            <Plus size={24} className="text-text" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 mt-2">
          {contacts.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-text-secondary text-base">
                No contacts yet
              </Text>
              <Text className="text-text-muted text-sm mt-1">
                Tap + to add a contact
              </Text>
            </View>
          ) : (
            contacts.map((contact) => (
              <View
                key={contact.id}
                className="flex-row items-center px-4 py-3 border-b border-border"
              >
                <Pressable
                  onPress={() => setArchiveTarget(contact)}
                  className="mr-3"
                  hitSlop={8}
                >
                  <View className="w-6 h-6 rounded-full bg-error items-center justify-center">
                    <Minus size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Pressable>
                <Text className="text-base text-text flex-1">{contact.name}</Text>
                <Pressable
                  onPress={() => setFormTarget(contact)}
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
          title={formTarget === "add" ? "Add Contact" : "Edit Contact"}
          initialName={
            formTarget && formTarget !== "add" ? formTarget.name : undefined
          }
          onClose={() => setFormTarget(null)}
          onSubmit={handleSubmit}
        />

        <ConfirmModal
          visible={archiveTarget !== null}
          title={`Delete "${archiveTarget?.name ?? ""}"?`}
          message="Your transactions will not be deleted. This contact will be archived and hidden from lists."
          confirmLabel="Archive"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => {
            if (archiveTarget) archiveContact.mutate(archiveTarget.id);
            setArchiveTarget(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
