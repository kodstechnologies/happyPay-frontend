import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { updateRetailerProfile } from "../../../../services/api/retailer/retailerProfileApi";
import type { RetailerFullProfile } from "../../../../types/retailer/profile";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  documentKey: string;
  documentTitle: string;
  currentUrl?: string | null;
  onSuccess: (updatedProfile: RetailerFullProfile) => void;
}

export default function DocumentUploadModal({
  open,
  onClose,
  documentKey,
  documentTitle,
  currentUrl,
  onSuccess,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10 MB.");
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, or PDF files are supported.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append(documentKey, selectedFile);

      const response = await updateRetailerProfile(formData);
      if (response && response.data) {
        onSuccess(response.data);
        handleClose();
      } else {
        throw new Error("Failed to upload document.");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "An error occurred while uploading. Please try again.";
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Update ${documentTitle}`}
      description="Upload a clear, legible copy (JPG, PNG, or PDF up to 10MB)"
      icon={Upload}
      size="md"
      submitLabel="Submit Document"
      isSubmitting={isUploading}
      submitDisabled={!selectedFile || isUploading}
      onSubmit={handleUpload}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {/* Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
              selectedFile
                ? "border-[#7c3aed] bg-purple-50/20"
                : "border-slate-200 hover:border-[#7c3aed] hover:bg-slate-50"
            }`}
          >
            {previewUrl ? (
              <div className="relative mb-3 max-h-40 w-full overflow-hidden rounded-lg">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mx-auto h-40 object-contain rounded-lg"
                />
              </div>
            ) : selectedFile ? (
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#7c3aed]">
                <FileText className="h-7 w-7" />
              </div>
            ) : (
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7c3aed] group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
            )}

            {selectedFile ? (
              <div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Click or drag file to upload
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Supports JPG, PNG, PDF up to 10MB
                </p>
              </div>
            )}
          </div>

          {currentUrl && !selectedFile && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600 border border-slate-200">
              <span className="truncate">Current uploaded document is active</span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#7c3aed] hover:underline shrink-0 ml-2"
              >
                View
              </a>
            </div>
          )}

      </div>
    </Modal>
  );
}
