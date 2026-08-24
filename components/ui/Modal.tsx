"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-xs data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] flex max-h-[88vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-5 shadow-2xl focus:outline-none data-[state=open]:animate-fade-in">
          <div className="mb-3 flex items-center justify-between border-b border-eco-100 pb-3">
            <Dialog.Title className="font-display text-base font-bold text-eco-900">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-eco-700 hover:bg-eco-50">
              <X size={18} />
              <span className="sr-only">Закрыть</span>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
