"use client";

import { PiTrashBold } from "react-icons/pi";
import ActionForm, { SubmitButton, type ActionState } from "@/components/admin/action-form";

export default function DeleteButton({
  action,
  id,
  confirm,
  label = "Delete",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  confirm: string;
  label?: string;
}) {
  return (
    <ActionForm action={action} confirm={confirm}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn btn-soft btn-sm text-tomato" pendingText="…">
        <PiTrashBold /> {label}
      </SubmitButton>
    </ActionForm>
  );
}
