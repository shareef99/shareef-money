import { createFileRoute, Link } from "@tanstack/react-router";
import { TextInput, PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import {
  registerSchema,
  type RegisterInput,
} from "@shareef-money/shared/validation";
import { parseError } from "@shareef-money/shared";
import { useRegister } from "../../queries/auth";
import { z } from "zod";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

type FormValues = z.infer<typeof registerSchema>;

function RegisterPage() {
  const register = useRegister();
  const navigate = Route.useNavigate();

  const { getInputProps, onSubmit, submitting } = useForm<RegisterInput>({
    mode: "uncontrolled",
    validate: zod4Resolver(registerSchema),
    validateInputOnBlur: true,
  });

  const handleSubmit = async (data: FormValues) => {
    await register.mutateAsync(data, {
      onSuccess: () => {
        navigate({ to: "/transactions" });
      },
      onError: (error) => {
        parseError(error);
      },
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-text mb-8">
        Create Account
      </h1>
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <TextInput
          label="Name"
          placeholder="Your name"
          {...getInputProps("name")}
        />
        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Min. 8 characters"
          {...getInputProps("password")}
        />
        <Button type="submit" loading={submitting} className="mt-2">
          Create Account
        </Button>
      </form>

      <p className="text-sm text-text-secondary mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
