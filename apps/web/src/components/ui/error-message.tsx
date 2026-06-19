import { parseError } from "@shareef-money/shared";

type Props = {
  error: unknown;
};

export default function ErrorMessage({ error }: Props) {
  return (
    <div>
      <p className="text-error font-medium">Error: {parseError(error)}</p>
    </div>
  );
}
