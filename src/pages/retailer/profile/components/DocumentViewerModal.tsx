import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ShieldCheck,
  Clock,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Modal from "../../../../components/common/Modal";
import type { DocumentStatus } from "../../../../types/retailer/profile";

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  docUrl?: string | null;
  status?: DocumentStatus;
  rejectionReason?: string | null;
}

export default function DocumentViewerModal({
  open,
  onClose,
  title,
  docUrl,
  status = "NOT_SUBMITTED",
  rejectionReason,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleClose = () => {
    setZoom(1);
    setRotation(0);
    onClose();
  };

  if (!open) return null;

  const isPdf =
    docUrl?.toLowerCase().includes(".pdf") ||
    docUrl?.toLowerCase().startsWith("data:application/pdf");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    if (!docUrl) return;
    const link = document.createElement("a");
    link.href = docUrl;
    link.download = `${title.replace(/\s+/g, "_")}${isPdf ? ".pdf" : ".jpg"}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3.5 w-3.5" /> Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
            <HelpCircle className="h-3.5 w-3.5" /> Not Submitted
          </span>
        );
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      icon={FileText}
      size="2xl"
      hideFooter={true}
      bodyClassName="p-0 overflow-hidden flex flex-col"
      headerActions={
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          {!isPdf && docUrl && (
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {docUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition ml-1"
              title="Download Document"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-1 flex-col">

        {/* Rejection Alert Banner if rejected */}
        {status === "REJECTED" && rejectionReason && (
          <div className="flex items-start gap-2.5 bg-rose-50 px-6 py-3 border-b border-rose-100 text-rose-800 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="font-semibold">Rejection Note: </span>
              <span>{rejectionReason}</span>
            </div>
          </div>
        )}

        {/* Viewer Content */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          {!docUrl ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <FileText className="h-16 w-16 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No document has been uploaded yet.
              </p>
            </div>
          ) : isPdf ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <iframe
                src={`${docUrl}#toolbar=0`}
                title={title}
                className="h-full w-full rounded-lg border border-slate-200 bg-white"
              />
              <div className="mt-2">
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7c3aed] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open PDF in new tab
                </a>
              </div>
            </div>
          ) : (
            <div
              className="flex max-h-full max-w-full items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={docUrl}
                alt={title}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
