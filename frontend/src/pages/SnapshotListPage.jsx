import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  EyeIcon,
  CopyIcon,
  TrashIcon,
  InboxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PaginationControls from "@/components/ui/pagination-controls";

const SORTABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "createdAt", label: "Created" },
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

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

function groupByInvoice(snapshots) {
  const map = new Map();
  for (const s of snapshots) {
    if (!map.has(s.invoiceId)) {
      map.set(s.invoiceId, {
        invoiceId: s.invoiceId,
        refNo: s.refNo || "-",
        clientName: s.clientName || "-",
        snapshots: [],
      });
    }
    map.get(s.invoiceId).snapshots.push(s);
  }
  return Array.from(map.values());
}

export default function SnapshotListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const invoiceFilter = searchParams.get("invoice") || "";
  const sortBy = searchParams.get("sort_by") || "createdAt";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef(null);

  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(null);
  const [collapsed, setCollapsed] = useState(new Set());
  const [invoiceRefNo, setInvoiceRefNo] = useState("");

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
      if (next.get("sort_by") === "createdAt") next.delete("sort_by");
      if (next.get("sort_order") === "desc") next.delete("sort_order");
      if (next.get("page") === "1") next.delete("page");
      if (next.get("limit") === "20") next.delete("limit");
      return next;
    }, { replace: true });
  }

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      updateParams({ sort_order: sortOrder === "asc" ? "desc" : "asc", page: null });
    } else {
      updateParams({ sort_by: columnKey, sort_order: "asc", page: null });
    }
  };

  // Sync local search input when URL changes externally
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

  const fetchSnapshots = useCallback(async () => {
    try {
      const data = await api.getAllSnapshots();
      setSnapshots(data);
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Fetch invoice ref number when filtering by invoice
  useEffect(() => {
    if (!invoiceFilter) {
      setInvoiceRefNo("");
      return;
    }
    api.getInvoice(invoiceFilter)
      .then((inv) => setInvoiceRefNo(inv.refNo || `#${invoiceFilter}`))
      .catch(() => setInvoiceRefNo(`#${invoiceFilter}`));
  }, [invoiceFilter]);

  const handleClone = async (id) => {
    setCloning(id);
    try {
      const newInvoice = await api.cloneSnapshot(id);
      toast.success("Invoice created from snapshot");
      navigate(`/invoices/${newInvoice.id}/edit`);
    } catch (err) {
      console.error("Failed to clone snapshot:", err);
      toast.error("Failed to clone snapshot");
    } finally {
      setCloning(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteSnapshot(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchSnapshots();
      toast.success("Snapshot deleted");
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
      toast.error("Failed to delete snapshot");
    } finally {
      setDeleting(false);
    }
  };

  const toggleGroup = (invoiceId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  };

  // Group, filter, and paginate
  const filteredGroups = useMemo(() => {
    let groups = groupByInvoice(snapshots);

    // Filter by invoice ID param
    if (invoiceFilter) {
      groups = groups.filter((g) => String(g.invoiceId) === invoiceFilter);
    }

    // Filter by search
    if (urlSearch) {
      const q = urlSearch.toLowerCase();
      groups = groups
        .map((g) => {
          // Match on group-level fields
          const groupMatch =
            g.refNo.toLowerCase().includes(q) ||
            g.clientName.toLowerCase().includes(q);
          // Match on snapshot names
          const matchingSnapshots = g.snapshots.filter((s) =>
            s.name.toLowerCase().includes(q)
          );
          if (groupMatch) return g; // show all snapshots in matching group
          if (matchingSnapshots.length > 0) {
            return { ...g, snapshots: matchingSnapshots };
          }
          return null;
        })
        .filter(Boolean);
    }

    // Sort sub-rows within each group
    const sortedGroups = groups.map((g) => ({
      ...g,
      snapshots: [...g.snapshots].sort((a, b) => {
        let aVal, bVal;
        if (sortBy === "name") {
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
        } else {
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }),
    }));

    // Sort groups
    sortedGroups.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = (a.snapshots[0]?.name || "").toLowerCase();
        bVal = (b.snapshots[0]?.name || "").toLowerCase();
      } else {
        aVal = a.snapshots[0]?.createdAt ? new Date(a.snapshots[0].createdAt).getTime() : 0;
        bVal = b.snapshots[0]?.createdAt ? new Date(b.snapshots[0].createdAt).getTime() : 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sortedGroups;
  }, [snapshots, urlSearch, invoiceFilter, sortBy, sortOrder]);

  const totalGroups = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / limit));
  const paginatedGroups = filteredGroups.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Snapshots</h1>
          <p className="text-muted-foreground">Browse and manage invoice snapshots</p>
        </div>
      </div>

      {/* Search and invoice filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by snapshot name, invoice ref, or client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        {invoiceFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParams({ invoice: null, page: null })}
          >
            Filtered by invoice
            <XIcon className="ml-1 size-3" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <InboxIcon className="size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No snapshots yet. Save a snapshot from any invoice to get started.
          </p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <InboxIcon className="size-8 text-muted-foreground/50" />
          {invoiceFilter ? (
            <>
              <p className="text-muted-foreground">
                No snapshots found for invoice <span className="font-medium text-foreground">{invoiceRefNo || invoiceFilter}</span>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ invoice: null, page: null })}
              >
                Show all snapshots
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              No snapshots match your search.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
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
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.map((group) => {
                  const isCollapsed = collapsed.has(group.invoiceId);
                  return (
                    <GroupRows
                      key={group.invoiceId}
                      group={group}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.invoiceId)}
                      onView={(id) => navigate(`/snapshots/${id}`)}
                      onClone={handleClone}
                      onDelete={(id) => {
                        setDeleteId(id);
                        setDeleteDialogOpen(true);
                      }}
                      cloning={cloning}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            limit={limit}
            total={totalGroups}
            onPageChange={(p) => updateParams({ page: p })}
            onLimitChange={(l) => updateParams({ limit: l, page: null })}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snapshot? This action cannot be undone.
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

function GroupRows({ group, isCollapsed, onToggle, onView, onClone, onDelete, cloning }) {
  return (
    <>
      {/* Group header row */}
      <TableRow
        className="bg-muted/50 cursor-pointer hover:bg-muted"
        onClick={onToggle}
      >
        <TableCell className="w-8 px-2">
          {isCollapsed ? (
            <ChevronRightIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </TableCell>
        <TableCell colSpan={3} className="font-semibold">
          {group.refNo} — {group.clientName}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({group.snapshots.length} snapshot{group.snapshots.length !== 1 ? "s" : ""})
          </span>
        </TableCell>
      </TableRow>

      {/* Snapshot sub-rows */}
      {!isCollapsed &&
        group.snapshots.map((snapshot) => (
          <TableRow key={snapshot.id}>
            <TableCell></TableCell>
            <TableCell className="font-medium">{snapshot.name}</TableCell>
            <TableCell>{formatDate(snapshot.createdAt)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs">
                    <MoreHorizontalIcon />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuItem onClick={() => onView(snapshot.id)}>
                    <EyeIcon />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={cloning === snapshot.id}
                    onClick={() => onClone(snapshot.id)}
                  >
                    <CopyIcon />
                    Clone to Invoice
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(snapshot.id)}
                  >
                    <TrashIcon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
