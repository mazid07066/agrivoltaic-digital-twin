"use client";

import { useTransition } from "react";

import { signOutAction } from "@/app/auth/actions";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({
  className = "",
}: LogoutButtonProps) {
  const [pending, startTransition] =
    useTransition();

  function handleLogout() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={className}
    >
      {pending
        ? "Signing out..."
        : "Logout"}
    </button>
  );
}
