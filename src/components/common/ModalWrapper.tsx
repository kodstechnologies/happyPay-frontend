import { useEffect, type ReactNode } from "react";
import { X, LoaderCircle, Trash2, type LucideIcon } from "lucide-react";

export type ModalVariant = "primary" | "danger" | "info" | "warning";
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: ModalVariant;
  size?: ModalSize;
  topGradient?: string | false;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  tabs?: ReactNode;
  headerTabs?: ReactNode;
  headerActions?: ReactNode;
  bodyClassName?: string;
  hideFooter?: boolean;
  footer?: ReactNode;

  // Form / Submit Actions
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  formId?: string;

  // Destructive / Delete Actions
  onDelete?: () => void;
  deleteLabel?: string;
  isDeleting?: boolean;
  deleteDisabled?: boolean;

  // Direct Confirmation Action (for Confirm / Danger dialogs)
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
  "3xl": "max-w-5xl",
  "4xl": "max-w-6xl",
};

const variantConfigs: Record<
  ModalVariant,
  {
    gradient: string;
    iconBg: string;
    iconText: string;
    confirmBtn: string;
  }
> = {
  primary: {
    gradient: "bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#c084fc]",
    iconBg: "bg-gradient-to-br from-purple-50 to-purple-100/60 border-purple-200/50",
    iconText: "text-[#7c3aed]",
    confirmBtn:
      "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] shadow-[#7c3aed]/25 text-white focus:ring-[#7c3aed]/40",
  },
  danger: {
    gradient: "bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500",
    iconBg: "bg-rose-50 border-rose-100",
    iconText: "text-rose-600",
    confirmBtn:
      "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/25 text-white focus:ring-rose-500/40",
  },
  info: {
    gradient: "bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400",
    iconBg: "bg-blue-50 border-blue-100",
    iconText: "text-blue-600",
    confirmBtn:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25 text-white focus:ring-blue-500/40",
  },
  warning: {
    gradient: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400",
    iconBg: "bg-amber-50 border-amber-100",
    iconText: "text-amber-600",
    confirmBtn:
      "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/25 text-white focus:ring-amber-500/40",
  },
};

export default function ModalWrapper({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  variant = "primary",
  size = "md",
  topGradient,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  tabs,
  headerTabs,
  headerActions,
  bodyClassName,
  hideFooter = false,
  footer,
  submitLabel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
  formId,
  onDelete,
  deleteLabel = "Delete",
  isDeleting = false,
  deleteDisabled = false,
  confirmLabel,
  onConfirm,
}: ModalWrapperProps) {
  const config = variantConfigs[variant];

  // Escape key handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isSubmitting, isDeleting]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      closeOnOverlayClick &&
      !isSubmitting &&
      !isDeleting &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  };

  const hasHeader = Boolean(
    title || description || Icon || showCloseButton || headerActions
  );

  const hasStandardFooter =
    !hideFooter &&
    !footer &&
    Boolean(submitLabel || onSubmit || formId || onConfirm || confirmLabel || onDelete);

  const isDestructiveMode = Boolean(onConfirm || (variant === "danger" && confirmLabel));

  const resolvedTopGradient =
    topGradient === false ? null : topGradient ? topGradient : config.gradient;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-all animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-wrapper-title" : undefined}
      onMouseDown={handleOverlayClick}
    >
      <div
        className={`relative flex max-h-[90vh] w-full ${sizeClasses[size]} flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl`}
      >
        {/* Top Accent Gradient Bar */}
        {resolvedTopGradient && (
          <div className={`h-1.5 w-full shrink-0 ${resolvedTopGradient}`} />
        )}

        {/* Modal Header */}
        {hasHeader && (
          <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-4.5">
            <div className="flex min-w-0 items-center gap-3.5 pr-2">
              {Icon && (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition ${config.iconBg} ${config.iconText}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id="modal-wrapper-title"
                    className="truncate text-base font-bold tracking-tight text-slate-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {headerActions}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                  aria-label="Close modal"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Optional Header Tabs */}
        {(tabs || headerTabs) && (
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/60">
            {tabs || headerTabs}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName ?? "p-6"}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {!hideFooter && (footer || hasStandardFooter) && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
            {footer ? (
              footer
            ) : isDestructiveMode ? (
              /* Destructive / Confirm Mode Actions */
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {cancelLabel}
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isSubmitting || isDeleting || submitDisabled}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md transition disabled:opacity-60 focus:outline-none focus:ring-2 ${config.confirmBtn}`}
                >
                  {isSubmitting || isDeleting ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{confirmLabel || "Confirm Delete"}</span>
                  )}
                </button>
              </div>
            ) : (
              /* Standard Form Mode Actions (Save / Cancel / Optional Delete) */
              <div className="flex items-center justify-between gap-3">
                {onDelete ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting || isSubmitting || deleteDisabled}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>{deleteLabel}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting || isDeleting}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>

                  {(submitLabel || onSubmit || formId) && (
                    <button
                      form={formId}
                      type={formId ? "submit" : onSubmit ? "button" : "submit"}
                      onClick={onSubmit}
                      disabled={isSubmitting || submitDisabled}
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-md transition disabled:opacity-60 focus:outline-none focus:ring-2 ${config.confirmBtn}`}
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{submitLabel || "Save Changes"}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
