import { ArrowLeft, FileText, Loader2, Paperclip, Search, Eye, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAllSupportTickets, assignTicket, updateTicketStatus, type SupportTicket } from "../../../services/api/admin/supportApi";

type TicketStatus = "Open" | "In Progress" | "Resolved";
type Message = { id: number; author: string; role: "Retailer" | "Admin"; text: string; time: string };
type Ticket = { id: string; retailer: string; retailerId: string; subject: string; category: string; status: TicketStatus; assignee: string; assigneeId?: string; updated: string; messages: Message[] };

const statusStyles: Record<TicketStatus, string> = { Open: "bg-blue-50 text-blue-700", "In Progress": "bg-amber-50 text-amber-700", Resolved: "bg-emerald-50 text-emerald-700" };

const mapApiStatusToUiStatus = (apiStatus: string): TicketStatus => {
  const statusMap: Record<string, TicketStatus> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Resolved",
  };

  return statusMap[apiStatus.toLowerCase()] || "Open";
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [viewingChat, setViewingChat] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];
  const filteredTickets = useMemo(() => tickets.filter((ticket) => `${ticket.id} ${ticket.retailer} ${ticket.subject} ${ticket.category} ${ticket.assignee}`.toLowerCase().includes(search.toLowerCase())), [tickets, search]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setTicketsLoading(true);
        setTicketsError(null);

        const response = await getAllSupportTickets();

        const transformedTickets: Ticket[] = response.data
          .filter((ticket: SupportTicket) => ticket.retailerId !== null)
          .map(
            (ticket: SupportTicket) => ({
              id: ticket.ticketNumber,
              retailer: ticket.retailerId?.email || ticket.retailerId?.mobile || "Unknown",
              retailerId: ticket.retailerId?._id || "",
              subject: ticket.subject,
              category: ticket.otherCategory || ticket.category,
              status: mapApiStatusToUiStatus(ticket.status),
              assignee: ticket.assignedTo
                ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                : "Unassigned",
              assigneeId: ticket.assignedTo?._id,
              updated: formatRelativeTime(ticket.updatedAt),
              messages: [
                {
                  id: 1,
                  author: ticket.retailerId?.email || ticket.retailerId?.mobile || "Unknown",
                  role: "Retailer",
                  text: ticket.description,
                  time: formatTime(ticket.createdAt),
                },
              ],
            })
          );

        setTickets(transformedTickets);

        if (transformedTickets.length > 0 && !selectedId) {
          setSelectedId(transformedTickets[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setTicketsError("Failed to load tickets. Please try again.");
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchTickets();
  }, [selectedId]);

  const updateTicket = async (field: "status" | "assignee", value: string) => {
    try {
      if (field === "status") {
        setUpdatingStatus(true);
        const apiStatus = mapUiStatusToApiStatus(value);
        await updateTicketStatus(selectedTicket.id, apiStatus);
      } else if (field === "assignee") {
        setAssigning(true);
        if (value !== "Unassigned" && selectedTicket.assigneeId) {
          await assignTicket(selectedTicket.id, selectedTicket.assigneeId);
        }
      }

      setTickets((current) => current.map((ticket) => {
        if (ticket.id === selectedTicket.id) {
          const updatedMessages = [...ticket.messages];
          if (field === "assignee" && value !== "Unassigned" && value !== ticket.assignee) {
            updatedMessages.push({
              id: Date.now(),
              author: "System",
              role: "Admin",
              text: `${value} is assigned to retailer`,
              time: "Just now"
            });
          }
          return { ...ticket, [field]: value, updated: "Just now", messages: updatedMessages } as Ticket;
        }
        return ticket;
      }));
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert("Failed to update ticket. Please try again.");
    } finally {
      setUpdatingStatus(false);
      setAssigning(false);
    }
  };

  const mapUiStatusToApiStatus = (uiStatus: string): string => {
    const statusMap: Record<string, string> = {
      "Open": "open",
      "In Progress": "in_progress",
      "Resolved": "resolved",
    };

    return statusMap[uiStatus] || "open";
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">System</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
        <p className="mt-1 text-sm text-slate-500">Handle retailer-raised tickets, assign ownership, update status, and continue the conversation.</p>
      </section>
      
      {!viewingChat ? (
        <section className="hp-card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-100 p-5">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search retailer tickets..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#315bd1] focus:bg-white" />
            </div>
          </div>
          <div className="overflow-x-auto">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#315bd1]" />
              </div>
            ) : ticketsError ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">{ticketsError}</p>
              </div>
            ) : (
              <table className="hp-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>

                    <th>Retailer Name</th>
                    <th>Category</th>
                    <th>Ticket Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><span className="font-bold text-[#315bd1]">{ticket.id}</span></td>

                      <td className="font-bold text-slate-900">{ticket.retailer}</td>
                      <td>{ticket.category}</td>
                      <td><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[ticket.status]}`}>{ticket.status}</span></td>
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setSelectedId(ticket.id);
                            setViewingChat(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#315bd1] hover:bg-[#315bd1] hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">No tickets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : (
        <section className="hp-card flex h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {selectedTicket && (
            <>
              <header className="border-b border-slate-100 p-5 bg-slate-50/50">
                <div className="flex items-center gap-4 mb-4">
                  <button onClick={() => setViewingChat(false)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">Ticket Details</h2>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3 pl-10">
                  <div>
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#315bd1]" /><span className="text-xs font-bold text-[#315bd1]">{selectedTicket.id}</span></div>
                    <h2 className="mt-2 text-base font-bold text-slate-900">{selectedTicket.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">{selectedTicket.retailer} · {selectedTicket.category}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${statusStyles[selectedTicket.status]}`}>{selectedTicket.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 pl-10">
           
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status
                    <select
                      value={selectedTicket.status}
                      onChange={(event) => updateTicket("status", event.target.value)}
                      disabled={updatingStatus}
                      className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-700 disabled:opacity-50"
                    >
                      <option>Open</option><option>In Progress</option><option>Resolved</option>
                    </select>
                  </label>
                </div>
              </header>
              <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Subject</h3>
                  <p className="text-sm text-slate-700">{selectedTicket.subject}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Description</h3>
                  <p className="text-sm text-slate-700 leading-6">{selectedTicket.messages[0]?.text || "No description provided"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Ticket Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Retailer:</span>
                      <p className="font-semibold text-slate-900">{selectedTicket.retailer}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-semibold text-slate-900">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <p className="font-semibold text-slate-900">{selectedTicket.status}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Updated:</span>
                      <p className="font-semibold text-slate-900">{selectedTicket.updated}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 p-4">
                {selectedTicket.status === "Resolved" ? (
                  <div className="text-center py-3 text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                    This ticket is resolved. Change status to Open or In Progress to reply.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    {attachedFile && (
                      <div className="flex items-center justify-between bg-[#f5f7ff] border border-[#315bd1]/20 rounded-xl p-3 text-xs text-[#315bd1] mx-1">
                        <span className="truncate font-semibold flex items-center gap-2"><Paperclip className="h-4 w-4" /> {attachedFile.name}</span>
                        <button type="button" onClick={() => setAttachedFile(null)} className="p-1.5 hover:bg-[#315bd1]/10 rounded-full transition-colors"><X className="h-4 w-4" /></button>
                      </div>
                    )}
                  
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
