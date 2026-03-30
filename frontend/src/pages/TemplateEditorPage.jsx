import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { formData, setFormData, fontId, setFontId } = invoiceForm;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Load existing template
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const template = await api.getTemplate(id);
        if (template.jsonData) setFormData(template.jsonData);
        if (template.fontId) setFontId(template.fontId);
        if (template.name) setTemplateName(template.name);
      } catch (err) {
        console.error('Failed to load template:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, setFormData, setFontId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: templateName || 'Untitled Template',
        jsonData: formData,
        fontId,
      };
      if (id) {
        await api.updateTemplate(id, payload);
      } else {
        const result = await api.createTemplate(payload);
        navigate(`/templates/${result.id}/edit`, { replace: true });
      }
      toast.success('Template saved');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorLayout
      title={id ? 'Edit Template' : 'New Template'}
      loading={loading}
      headerExtra={
        <input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template name"
          className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      }
      headerActions={
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Save
        </Button>
      }
      {...invoiceForm}
    />
  );
}
