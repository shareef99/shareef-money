import { ReactNode } from "react";

export default function H4({ children }: { children: ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  );
}
