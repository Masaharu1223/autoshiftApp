"use client";

import { createMember } from "@/lib/api/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTransition, useRef } from "react";

export function MemberForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createMember(formData);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          name="name"
          label="新しいメンバー"
          placeholder="名前を入力"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "追加中..." : "追加"}
      </Button>
    </form>
  );
}
