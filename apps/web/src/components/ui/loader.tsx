import { Loader as MLoader } from "@mantine/core";
import type { LoaderProps } from "@mantine/core";
import { twMerge } from "tailwind-merge";

type Props = LoaderProps & {
  fullscreen?: boolean;
  className?: string;
};

export default function Loader({
  fullscreen = false,
  className,
  ...props
}: Props) {
  return (
    <div
      className={twMerge(
        fullscreen && "flex h-[80vh] items-center justify-center",
        className
      )}
    >
      <MLoader type="oval" {...props} />
    </div>
  );
}
