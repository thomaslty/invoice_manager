import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { api } from '@/lib/api';
import { Save, Download, Loader2 } from 'lucide-react';

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
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

  // Fetch fonts
  useEffect(() => {
    api.getFonts().then(setFonts).catch(console.error);
  }, []);

  // Load existing invoice or template defaults
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (id) {
          const invoice = await api.getInvoice(id);
          if (invoice.jsonData) {
            setFormData(invoice.jsonData);
          }
          if (invoice.fontId) {
            setFontId(invoice.fontId);
          }
        } else if (templateId) {
          const template = await api.getTemplate(templateId);
          if (template.jsonData) {
            setFormData(template.jsonData);
          }
          if (template.fontId) {
            setFontId(template.fontId);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, templateId, setFormData, setFontId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await api.updateInvoice(id, { jsonData: formData, fontId });
      } else {
        const result = await api.createInvoice({ jsonData: formData, fontId });
        navigate(`/invoices/${result.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (id) {
      window.open(api.getInvoicePdfUrl(id), '_blank');
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
          <h1 className="text-lg font-semibold truncate">
            {id ? 'Edit Invoice' : 'New Invoice'}
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
            {id && (
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-1.5" />
                PDF
              </Button>
            )}
          </div>
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
