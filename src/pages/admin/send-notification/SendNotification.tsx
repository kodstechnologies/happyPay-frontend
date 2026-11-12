import { useState, useEffect, useRef } from "react";
import { Bell, Send, Loader2, Upload, X, ChevronDown } from "lucide-react";
import { showToast } from "../../../utils/toast";
import { sendCustomNotification } from "../../../apis/adminNotifications.apis";
import { getAdminRetailers } from "../../../apis/adminRetailer.apis";
import type { AdminRetailer } from "../../../types/admin/retailer";

export default function SendNotification() {
  const [retailers, setRetailers] = useState<AdminRetailer[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<AdminRetailer | "ALL" | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch retailers on mount
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        setLoading(true);
        const response = await getAdminRetailers({ page: 1, limit: 100 });
        const retailersData = response.items || [];
        setRetailers(retailersData);
      } catch (error) {
        console.error("Failed to fetch retailers:", error);
        showToast("error", "Failed to load retailers list");
      } finally {
        setLoading(false);
      }
    };

    fetchRetailers();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("error", "Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendNotification = async () => {
    if (!selectedRetailer) {
      showToast("error", "Please select a retailer");
      return;
    }

    if (!title.trim()) {
      showToast("error", "Please enter notification title");
      return;
    }

    if (!body.trim()) {
      showToast("error", "Please enter notification body");
      return;
    }

    setSending(true);
    try {
      // Create FormData to send image along with other data
      const formData = new FormData();
      formData.append("retailerId", selectedRetailer === "ALL" ? "ALL" : selectedRetailer.id);
      formData.append("title", title.trim());
      formData.append("body", body.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Send the notification with FormData using the API
      await sendCustomNotification(formData);

      showToast("success", "Notification sent successfully!");

      // Reset form
      setTitle("");
      setBody("");
      setImageFile(null);
      setImagePreview("");
      setSelectedRetailer(null);
    } catch (error) {
      console.error("Failed to send notification:", error);
      showToast("error", error instanceof Error ? error.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
      {/* Header */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">
          Management
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#171717]">
          <Bell className="h-6 w-6 text-[#315bd1]" />
          Send Notification
        </h1>
        <p className="mt-1 text-sm text-[#8992a3]">
          Send custom notifications to individual retailers or all retailers.
        </p>
      </section>

      {/* Form */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
        {/* Retailer Selection - Dropdown */}
        <div>
          <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
            Select Retailer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-[54px] w-full rounded-xl border border-slate-200 bg-[#fafbfd] px-5 text-left text-sm font-medium outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/20 transition-all flex items-center justify-between"
            >
              <span className={selectedRetailer ? "text-slate-900" : "text-slate-400"}>
                {selectedRetailer === "ALL"
                  ? "All Retailers"
                  : selectedRetailer
                  ? `${selectedRetailer.fullName} - ${selectedRetailer.mobile}`
                  : "Select a retailer"}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {/* All Retailers Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRetailer("ALL");
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 bg-[#eef2ff]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#315bd1]">All Retailers</p>
                        <p className="text-xs text-slate-500">Send to all registered retailers</p>
                      </div>
                    </button>

                    {retailers.length > 0 ? (
                      retailers.map((retailer) => {
                        const name = retailer.fullName || "Unknown";
                        const shopName = retailer.shop?.name || "";
                        return (
                          <button
                            key={retailer.id}
                            type="button"
                            onClick={() => {
                              setSelectedRetailer(retailer);
                              setDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{name}</p>
                              <p className="text-xs text-slate-500">{retailer.mobile}</p>
                              {shopName && (
                                <p className="text-xs text-slate-400">{shopName}</p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        No retailers found
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
            Notification Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="h-[54px] w-full rounded-xl border border-slate-200 bg-[#fafbfd] px-5 text-sm font-medium outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/20 transition-all"
          />
          <p className="mt-1 text-xs text-slate-400">{title.length}/100 characters</p>
        </div>

        {/* Body */}
        <div>
          <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
            Notification Body <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Enter notification message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-slate-200 bg-[#fafbfd] px-5 py-3 text-sm leading-6 outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/20 transition-all"
          />
          <p className="mt-1 text-xs text-slate-400">{body.length}/500 characters</p>
        </div>

        {/* Image Upload (Optional) */}
        <div>
          <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
            Image (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[120px] w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-[#fafbfd] text-slate-400 hover:border-[#315bd1] hover:bg-[#eef2ff] hover:text-[#315bd1] transition-all"
            >
              <Upload className="h-8 w-8" />
              <div className="text-left">
                <p className="text-sm font-semibold">Click to upload image</p>
                <p className="text-xs">JPG, PNG (Max 5MB)</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl border border-slate-200 overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-[200px] w-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSendNotification}
          disabled={sending || !selectedRetailer || !title.trim() || !body.trim()}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#315bd1] text-sm font-bold text-white transition hover:bg-[#284aa0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Send Notification
            </>
          )}
        </button>
      </section>
    </div>
  );
}
