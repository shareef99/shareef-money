import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Tabs } from "@mantine/core";
import { getCategories } from "../../queries/categories";
import {
  getContacts,
  useArchiveContact,
  useCreateContact,
  useUpdateContact,
} from "../../queries/contacts";
import {
  getLocations,
  useArchiveLocation,
  useCreateLocation,
  useUpdateLocation,
} from "../../queries/locations";
import { Title } from "../../components/ui/title";
import { CategoriesSection } from "../../components/manage/categories-section";
import { NameEntitySection } from "../../components/manage/name-entity-section";

export const Route = createFileRoute("/_app/manage")({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(getCategories()),
      queryClient.ensureQueryData(getContacts()),
      queryClient.ensureQueryData(getLocations()),
    ]);
  },
  component: ManagePage,
});

function ManagePage() {
  const { data: categories } = useSuspenseQuery(getCategories());
  const { data: contacts } = useSuspenseQuery(getContacts());
  const { data: locations } = useSuspenseQuery(getLocations());

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const archiveContact = useArchiveContact();

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const archiveLocation = useArchiveLocation();

  return (
    <div className="flex flex-col gap-6">
      <Title order={1}>Manage</Title>

      <Tabs defaultValue="categories">
        <Tabs.List>
          <Tabs.Tab value="categories">Categories</Tabs.Tab>
          <Tabs.Tab value="contacts">People</Tabs.Tab>
          <Tabs.Tab value="locations">Locations</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="categories" className="pt-6">
          <CategoriesSection categories={categories} />
        </Tabs.Panel>

        <Tabs.Panel value="contacts" className="pt-6">
          <NameEntitySection
            entityLabel="person"
            items={contacts.filter((c) => !c.isArchived)}
            onCreate={(name) => createContact.mutateAsync({ name })}
            onUpdate={(id, name) => updateContact.mutateAsync({ id, payload: { name } })}
            onArchive={(id) => archiveContact.mutate(id)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="locations" className="pt-6">
          <NameEntitySection
            entityLabel="location"
            items={locations.filter((l) => !l.isArchived)}
            onCreate={(name) => createLocation.mutateAsync({ name })}
            onUpdate={(id, name) => updateLocation.mutateAsync({ id, payload: { name } })}
            onArchive={(id) => archiveLocation.mutate(id)}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
