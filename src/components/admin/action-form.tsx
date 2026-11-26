"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionState = { ok: boolean; message: string };
type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn btn-primary",
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

/**
 * A form wired to a server action, with a friendly success / error
 * message. Set resetOnSuccess for "add" forms.
 */
export default function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
  onSuccess,
  id,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  onSuccess?: () => void;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef(state);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  // React once to each new result from the server.
  useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      onSuccessRef.current?.();
    }
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      id={id}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`col-span-full mt-1 rounded-xl px-3 py-2 text-sm font-bold ${state.ok ? "bg-mint text-leaf-dark" : "bg-tomato/10 text-tomato"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
