import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogProps,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddAccount } from "@/routes/_dashboard/accounts/-query";
import { useAuth } from "@/store/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

type Props = DialogProps;

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

export default function AddAccount({ ...props }: Props) {
  const auth = useAuth();
  const { mutateAsync } = useAddAccount();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Mutations

  // Functions
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!auth) return;

    mutateAsync(
      {
        name: data.name,
        description: data.description,
        amount: data.amount,
        is_hidden: false,
        user_id: auth.id,
      },
      {
        onSuccess: () => {
          props.onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
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
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
