import { createFileRoute, Link } from "@tanstack/react-router";
import { TextInput, PasswordInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { loginSchema, type LoginInput } from "@shareef-money/shared/validation";
import { parseError } from "@shareef-money/shared";
import { useLogin } from "../../queries/auth";
import { z } from "zod";
import { errorNotification } from "../../lib/notifications";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

type FormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const login = useLogin();
  const navigate = Route.useNavigate();

  const { getInputProps, onSubmit, submitting } = useForm<LoginInput>({
    mode: "uncontrolled",
    validate: zod4Resolver(loginSchema),
    validateInputOnBlur: true,
  });

  const handleSubmit = async (data: FormValues) => {
    await login.mutateAsync(data, {
      onSuccess: () => {
        navigate({ to: "/transactions" });
      },
      onError: (error) => {
        errorNotification({
          message: parseError(error),
        });
      },
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-text mb-8">Sign In</h1>

      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <TextInput
          label="Email"
          placeholder="your@email.com"
          {...getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          {...getInputProps("password")}
        />
        <Button type="submit" loading={submitting} className="mt-2">
          Sign In
        </Button>
      </form>

      <p className="text-sm text-text-secondary mt-6 text-center">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
