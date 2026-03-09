import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { CopyIcon, TrashIcon, InboxIcon } from "lucide-react";
import { toast } from "sonner";

export default function SnapshotList({ invoiceId, open, onOpenChange }) {
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(null);

  const fetchSnapshots = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const data = await api.getSnapshots(invoiceId);
      setSnapshots(data);
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (open && invoiceId) {
      fetchSnapshots();
    }
  }, [open, invoiceId, fetchSnapshots]);

  const handleClone = async (snapshotId) => {
    setCloning(snapshotId);
    try {
      const newInvoice = await api.cloneSnapshot(snapshotId);
      onOpenChange(false);
      toast.success('Invoice created from snapshot');
      navigate(`/invoices/${newInvoice.id}/edit`);
    } catch (err) {
      console.error("Failed to clone snapshot:", err);
      toast.error('Failed to clone snapshot');
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
      toast.success('Snapshot deleted');
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
      toast.error('Failed to delete snapshot');
    } finally {
      setDeleting(false);
    }
  };

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateStr;
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Snapshots</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : snapshots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <InboxIcon className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No snapshots for this invoice
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {snapshot.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(snapshot.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="Clone as new invoice"
                        disabled={cloning === snapshot.id}
                        onClick={() => handleClone(snapshot.id)}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="Delete snapshot"
                        onClick={() => {
                          setDeleteId(snapshot.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <TrashIcon className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Snapshot Confirmation */}
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
    </>
  );
}
