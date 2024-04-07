import { parseError } from "../helpers/general";

type Props = {
  error: unknown;
};

export default function ErrorMessage({ error }: Props) {
  return (
    <div>
      <p className="text-red-500">Error: {parseError(error)}</p>
    </div>
  );
}
