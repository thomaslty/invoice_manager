import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  DownloadIcon,
  CameraIcon,
  TrashIcon,
  HistoryIcon,
} from "lucide-react";
import { toast } from "sonner";
import PaginationControls from "@/components/ui/pagination-controls";

const SORTABLE_COLUMNS = [
  { key: "ref_no", label: "Ref No" },
  { key: "client_name", label: "Client" },
  { key: "date", label: "Date" },
  { key: "total_amount", label: "Total Amount" },
];

function SortIcon({ columnKey, sortBy, sortOrder }) {
  if (sortBy !== columnKey) {
    return <ArrowUpDownIcon className="size-3.5 text-muted-foreground/50" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUpIcon className="size-3.5" />
  ) : (
    <ArrowDownIcon className="size-3.5" />
  );
}

function formatCurrency(amount) {
  if (amount == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export default function InvoiceTable() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL params
  const sortBy = searchParams.get("sort_by") || "date";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const urlSearch = searchParams.get("search") || "";

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Snapshot dialog state
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotInvoiceId, setSnapshotInvoiceId] = useState(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sync local search input when URL changes externally (e.g., browser back)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce search input → update URL param
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateParams({ search: searchInput || null, page: null });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateParams(updates) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      // Remove defaults to keep URL clean
      if (next.get("sort_by") === "date") next.delete("sort_by");
      if (next.get("sort_order") === "desc") next.delete("sort_order");
      if (next.get("page") === "1") next.delete("page");
      if (next.get("limit") === "20") next.delete("limit");
      return next;
    }, { replace: true });
  }

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (urlSearch) params.search = urlSearch;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      params.page = page;
      params.limit = limit;
      const result = await api.getInvoices(params);
      setInvoices(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [urlSearch, sortBy, sortOrder, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      updateParams({ sort_order: sortOrder === "asc" ? "desc" : "asc", page: null });
    } else {
      updateParams({ sort_by: columnKey, sort_order: "asc", page: null });
    }
  };

  const handleDelete = async () => {
    if (!deleteInvoiceId) return;
    setDeleting(true);
    try {
      await api.deleteInvoice(deleteInvoiceId);
      setDeleteDialogOpen(false);
      setDeleteInvoiceId(null);
      fetchInvoices();
      toast.success('Invoice deleted');
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotInvoiceId || !snapshotName.trim()) return;
    setSavingSnapshot(true);
    try {
      await api.createSnapshot(snapshotInvoiceId, { name: snapshotName.trim() });
      setSnapshotDialogOpen(false);
      setSnapshotName("");
      setSnapshotInvoiceId(null);
      toast.success('Snapshot saved');
    } catch (err) {
      console.error("Failed to save snapshot:", err);
      toast.error('Failed to save snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Search and Date Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference or client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => updateParams({ date_from: e.target.value || null, page: null })}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => updateParams({ date_to: e.target.value || null, page: null })}
              className="w-36"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => updateParams({ date_from: null, date_to: null, page: null })}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {SORTABLE_COLUMNS.map((col) => (
                <TableHead key={col.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon columnKey={col.key} sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {urlSearch || dateFrom || dateTo
                    ? "No invoices match your filters."
                    : "No invoices yet. Create your first invoice to get started."}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.refNo || "-"}</TableCell>
                  <TableCell>{invoice.clientName || "-"}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <EyeIcon />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                        >
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(api.getInvoicePdfUrl(invoice.id), "_blank")}
                        >
                          <DownloadIcon />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSnapshotInvoiceId(invoice.id);
                            setSnapshotName("");
                            setSnapshotDialogOpen(true);
                          }}
                        >
                          <CameraIcon />
                          Save as Snapshot
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/snapshots?invoice=${invoice.id}`)}
                        >
                          <HistoryIcon />
                          View Snapshots
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeleteInvoiceId(invoice.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        limit={limit}
        total={total}
        onPageChange={(p) => updateParams({ page: p })}
        onLimitChange={(l) => updateParams({ limit: l, page: null })}
      />

      {/* Save Snapshot Dialog */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Snapshot Name</label>
            <Input
              placeholder="e.g. v1.0, Final Draft"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && snapshotName.trim()) handleSaveSnapshot();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveSnapshot}
              disabled={!snapshotName.trim() || savingSnapshot}
            >
              {savingSnapshot ? "Saving..." : "Save Snapshot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
