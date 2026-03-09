import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { api } from '@/lib/api';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    formData,
    setFormData,
    fontId,
    setFontId,
    updateSection,
    toggleSection,
    updateMetadataField,
    addCategory,
    removeCategory,
    addItem,
    removeItem,
    updateItem,
    updateCategoryName,
    setCurrency,
    grandTotal,
  } = useInvoiceForm();

  const [fonts, setFonts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Fetch fonts
  useEffect(() => {
    api.getFonts().then(setFonts).catch(console.error);
  }, []);

  // Load existing template
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const template = await api.getTemplate(id);
        if (template.jsonData) {
          setFormData(template.jsonData);
        }
        if (template.fontId) {
          setFontId(template.fontId);
        }
        if (template.name) {
          setTemplateName(template.name);
        }
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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12))] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))] -m-6">
      {/* Left panel — Editor */}
      <div className="w-1/2 flex flex-col border-r border-border min-w-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <h1 className="text-lg font-semibold shrink-0">
              {id ? 'Edit Template' : 'New Template'}
            </h1>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="shrink-0">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <InvoiceForm
            formData={formData}
            fontId={fontId}
            setFontId={setFontId}
            updateSection={updateSection}
            toggleSection={toggleSection}
            updateMetadataField={updateMetadataField}
            addCategory={addCategory}
            removeCategory={removeCategory}
            addItem={addItem}
            removeItem={removeItem}
            updateItem={updateItem}
            updateCategoryName={updateCategoryName}
            setCurrency={setCurrency}
            grandTotal={grandTotal}
            fonts={fonts}
          />
        </ScrollArea>
      </div>

      {/* Right panel — Preview */}
      <div className="w-1/2 min-w-0">
        <InvoicePreview formData={formData} fontId={fontId} />
      </div>
    </div>
  );
}
