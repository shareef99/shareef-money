import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogProps } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddCategory } from "@/routes/_dashboard/profile/-query";
import { useAuth } from "@/store/auth";
import { CategoryType } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

type Props = DialogProps & {
  type: CategoryType;
};

const schema = z.object({
  name: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

export default function AddCategory({ type, ...props }: Props) {
  const auth = useAuth();
  const { mutateAsync } = useAddCategory();

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

    await mutateAsync({
      name: data.name,
      type: type,
      user_id: auth.id,
    });

    props.onOpenChange(false);
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="Enter Name"
              className="border border-p-blue"
              {...register("name")}
            />
            {errors.name?.message && (
              <p className="text-red-500">{errors.name.message}</p>
            )}
          </div>
          <Button
            variant="secondary"
            type="submit"
            className="mx-auto !mt-4 flex w-full"
            disabled={isSubmitting}
          >
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
