import { ReactNode } from "react";

export default function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h1>
  );
}
