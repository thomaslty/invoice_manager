import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  PencilIcon,
  DownloadIcon,
  CameraIcon,
  TrashIcon,
  HistoryIcon,
} from "lucide-react";
import SnapshotList from "./SnapshotList";

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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Snapshot dialog state
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotInvoiceId, setSnapshotInvoiceId] = useState(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snapshot list state
  const [snapshotListOpen, setSnapshotListOpen] = useState(false);
  const [snapshotListInvoiceId, setSnapshotListInvoiceId] = useState(null);

  // Debounce ref
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await api.getInvoices(params);
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, sortOrder, dateFrom, dateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
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
    } catch (err) {
      console.error("Failed to delete invoice:", err);
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
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    } finally {
      setSavingSnapshot(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Date Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
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
                  {debouncedSearch || dateFrom || dateTo
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
                      <DropdownMenuContent align="end">
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
                          onClick={() => {
                            setSnapshotListInvoiceId(invoice.id);
                            setSnapshotListOpen(true);
                          }}
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

      {/* Snapshot List */}
      <SnapshotList
        invoiceId={snapshotListInvoiceId}
        open={snapshotListOpen}
        onOpenChange={setSnapshotListOpen}
      />
    </div>
  );
}
