import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import TemplateCard from "@/components/templates/TemplateCard";
import { toast } from "sonner";

export default function TemplateListPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDuplicate = async (template) => {
    try {
      await api.createTemplate({
        name: template.name + " (copy)",
        fontId: template.fontId,
        jsonData: template.jsonData,
      });
      fetchTemplates();
      toast.success('Template duplicated');
    } catch (err) {
      console.error("Failed to duplicate template:", err);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTemplate(id);
      fetchTemplates();
      toast.success('Template deleted');
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast.error('Failed to delete template');
    }
  };

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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
