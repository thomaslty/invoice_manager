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
  PlusIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  CopyIcon,
  TrashIcon,
  InboxIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PaginationControls from "@/components/ui/pagination-controls";

const SORTABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "updatedAt", label: "Last Updated" },
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
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export default function TemplateListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "updatedAt";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debounceRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      if (next.get("sort_by") === "updatedAt") next.delete("sort_by");
      if (next.get("sort_order") === "desc") next.delete("sort_order");
      if (next.get("page") === "1") next.delete("page");
      if (next.get("limit") === "20") next.delete("limit");
      return next;
    }, { replace: true });
  }

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

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      updateParams({ sort_order: sortOrder === "asc" ? "desc" : "asc", page: null });
    } else {
      updateParams({ sort_by: columnKey, sort_order: "asc", page: null });
    }
  };

  const handleDuplicate = async (template) => {
    try {
      await api.createTemplate({
        name: template.name + " (copy)",
        fontId: template.fontId,
        jsonData: template.jsonData,
      });
      fetchTemplates();
      toast.success("Template duplicated");
    } catch (err) {
      console.error("Failed to duplicate template:", err);
      toast.error("Failed to duplicate template");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteTemplate(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchTemplates();
      toast.success("Template deleted");
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast.error("Failed to delete template");
    }
  };

  // Filter, sort, paginate
  const filtered = useMemo(() => {
    let result = templates;
    if (urlSearch) {
      const q = urlSearch.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === "name") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
      } else {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [templates, urlSearch, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-muted-foreground">Manage invoice templates</p>
        </div>
        <Button onClick={() => navigate("/templates/new")}>
          <PlusIcon data-icon="inline-start" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by template name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No templates yet. Create your first template to get started.
          </p>
          <Button onClick={() => navigate("/templates/new")}>
            <PlusIcon data-icon="inline-start" />
            New Template
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <InboxIcon className="size-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No templates match your search.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
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
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{formatDate(template.updatedAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${template.name}`}>
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/templates/${template.id}`)}
                          >
                            <EyeIcon />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/templates/${template.id}/edit`)}
                          >
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(template)}
                          >
                            <CopyIcon />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setDeleteId(template.id);
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
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            limit={limit}
            total={filtered.length}
            onPageChange={(p) => updateParams({ page: p })}
            onLimitChange={(l) => updateParams({ limit: l, page: null })}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
