"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-72 max-w-[85vw] bg-white p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Меню</Dialog.Title>
          <Dialog.Close className="absolute right-4 top-4 rounded-full p-1 text-eco-700 hover:bg-eco-50">
            <X size={20} />
            <span className="sr-only">Закрыть</span>
          </Dialog.Close>
          <div className="mt-8 flex flex-col gap-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
