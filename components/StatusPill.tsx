import { CircleCheck, TriangleAlert } from "lucide-react";
import type { AppStatus } from "@/lib/types";

export default function StatusPill({ status }: { status: AppStatus }) {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 ease-spring ${
        isActive ? "bg-success-light text-success" : "bg-danger-light text-danger"
      }`}
    >
      {isActive ? (
        <CircleCheck size={14} strokeWidth={2.5} />
      ) : (
        <TriangleAlert size={14} strokeWidth={2.5} />
      )}
      {status}
    </span>
  );
}
