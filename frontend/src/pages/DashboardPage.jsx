import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon, FileTextIcon, FileIcon } from "lucide-react";
import InvoiceTable from "@/components/dashboard/InvoiceTable";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (templateDialogOpen) {
      setLoadingTemplates(true);
      api
        .getTemplates()
        .then(setTemplates)
        .catch((err) => console.error("Failed to fetch templates:", err))
        .finally(() => setLoadingTemplates(false));
    }
  }, [templateDialogOpen]);

  const handleSelectTemplate = (templateId) => {
    setTemplateDialogOpen(false);
    if (templateId) {
      navigate(`/invoices/new?template=${templateId}`);
    } else {
      navigate("/invoices/new");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices</p>
        </div>
        <Button onClick={() => setTemplateDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          New Invoice
        </Button>
      </div>

      <InvoiceTable />

      {/* Template Picker Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {loadingTemplates ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => handleSelectTemplate(null)}
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Blank Invoice</p>
                    <p className="text-xs text-muted-foreground">
                      Start from scratch
                    </p>
                  </div>
                </button>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Template</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
