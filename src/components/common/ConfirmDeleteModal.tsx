import { type ReactNode } from "react";
import { Trash2, AlertTriangle, type LucideIcon } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: ReactNode;
  itemName?: string;
  itemDetail?: string;
  warningNotice?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  icon?: LucideIcon;
}

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
  itemDetail,
  warningNotice,
  confirmLabel = "Delete Account",
  cancelLabel = "Cancel",
  isLoading = false,
  icon = Trash2,
}: ConfirmDeleteModalProps) {
  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={title}
      variant="danger"
      size="sm"
      icon={icon}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      isSubmitting={isLoading}
      onConfirm={onConfirm}
    >
      <div className="space-y-3">
        {description ? (
          <div className="text-xs text-slate-500 leading-relaxed">
            {description}
          </div>
        ) : itemName ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-800">{itemName}</span>
            {itemDetail ? (
              <>
                {" "}
                (ending in{" "}
                <span className="font-mono font-semibold text-slate-800">
                  {itemDetail}
                </span>
                )
              </>
            ) : null}
            ?
          </p>
        ) : null}

        {/* Warning Notice Box */}
        {warningNotice && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 border border-amber-200/80 text-amber-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">{warningNotice}</div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
