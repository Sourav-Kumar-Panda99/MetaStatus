"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Loader2,
  Trash2,
  Check,
  X,
  Mail,
} from "lucide-react";
import {
  setUserAdmin,
  removeTeamMember,
  type FullTeamMember,
} from "@/app/actions";

export default function TeamClient({
  initialMembers,
  currentUserId,
}: {
  initialMembers: FullTeamMember[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState<FullTeamMember[]>(initialMembers);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleToggleAdmin(member: FullTeamMember) {
    setTogglingId(member.id);
    setError(null);

    const { error: err } = await setUserAdmin(member.id, !member.is_admin);

    setTogglingId(null);

    if (err) {
      setError(err);
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id ? { ...m, is_admin: !m.is_admin } : m
      )
    );
  }

  async function handleRemove(member: FullTeamMember) {
    setRemovingId(member.id);
    setError(null);

    const { error: err } = await removeTeamMember(member.id);

    setRemovingId(null);
    setConfirmingId(null);

    if (err) {
      setError(err);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  }

  if (members.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-sm text-ink-soft backdrop-blur-xl">
        No team members found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {members.map((member, index) => {
        const isSelf = member.id === currentUserId;
        const isToggling = togglingId === member.id;
        const isRemoving = removingId === member.id;
        const isConfirming = confirmingId === member.id;

        return (
          <div
            key={member.id}
            className="animate-item-in flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card backdrop-blur-xl transition-all duration-200 ease-spring hover:shadow-cardHover sm:flex-row sm:items-center sm:justify-between"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                {member.username}
                {isSelf && (
                  <span className="text-xs font-normal text-ink-faint">
                    (you)
                  </span>
                )}
                {member.is_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
                    <ShieldCheck size={11} strokeWidth={2.5} />
                    Admin
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-faint">
                <Mail size={11} strokeWidth={2.25} />
                {member.email}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isConfirming ? (
                <>
                  <span className="text-xs text-ink-soft">
                    Remove {member.username}?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={isRemoving}
                    className="flex h-8 items-center gap-1 rounded-full bg-danger px-3 text-xs font-semibold text-white transition-all duration-150 ease-spring active:scale-95 disabled:opacity-60"
                  >
                    {isRemoving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={13} strokeWidth={2.5} />
                    )}
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={isRemoving}
                    className="flex h-8 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-ink-soft transition-all duration-150 ease-spring hover:bg-border active:scale-95 disabled:opacity-60"
                  >
                    <X size={13} strokeWidth={2.5} />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleToggleAdmin(member)}
                    disabled={isToggling || (isSelf && member.is_admin)}
                    title={
                      isSelf && member.is_admin
                        ? "You can't remove your own admin access"
                        : member.is_admin
                        ? "Remove admin access"
                        : "Grant admin access"
                    }
                    className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-150 ease-spring active:scale-95 disabled:opacity-50 ${
                      member.is_admin
                        ? "bg-success-light text-success hover:brightness-110"
                        : "bg-surface text-ink-soft hover:bg-primary-light hover:text-primary"
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : member.is_admin ? (
                      <ShieldCheck size={13} strokeWidth={2.5} />
                    ) : (
                      <Shield size={13} strokeWidth={2.5} />
                    )}
                    {member.is_admin ? "Admin" : "Make admin"}
                  </button>

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(member.id)}
                      aria-label={`Remove ${member.username}`}
                      title={`Remove ${member.username} from the team`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-all duration-150 ease-spring hover:bg-danger-light hover:text-danger active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
