"use client";

import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAddAccount } from "@/app/(dashboard)/accounts/query";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  amount: z
    .number({ invalid_type_error: "Required 1" })
    .positive("Must be positive"),
});

type FormValues = z.infer<typeof schema>;

export default function Page() {
  const router = useRouter();
  const { mutateAsync } = useAddAccount();

  // Forms
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Functions
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    mutateAsync(
      {
        name: data.name,
        description: data.description || "null",
        amount: data.amount,
        is_hidden: false,
        user_id: 22,
      },
      {
        onSuccess: () => {
          router.push("/accounts");
        },
      }
    );
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Add Account</CardTitle>
        </CardHeader>
        <CardContent className="w-80">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <div>
                <Label>Name</Label>
                <Input type="text" placeholder="Name" {...register("name")} />
              </div>
              {errors.name?.message && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name?.message}
                </p>
              )}
            </div>
            <div>
              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  placeholder="Description"
                  {...register("description")}
                />
              </div>
              {errors.description?.message && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description?.message}
                </p>
              )}
            </div>
            <div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Amount"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount?.message && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount?.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
