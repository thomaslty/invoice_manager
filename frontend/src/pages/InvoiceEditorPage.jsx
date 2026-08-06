import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { Save, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/** Strip the fields that must not carry over into a duplicate. */
function clearedForDuplicate(jsonData) {
  const fields = jsonData?.sections?.metadata?.fields || {};
  return {
    ...jsonData,
    sections: {
      ...jsonData.sections,
      metadata: {
        ...jsonData.sections.metadata,
        fields: { ...fields, refNo: '', date: '' },
      },
    },
  };
}

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateOf = searchParams.get('from');
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { formData, setFormData, setFontId, resetForm, isDirty, markPristine, fontId, grandTotal } = invoiceForm;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id && !duplicateOf) return;
      setLoading(true);
      try {
        if (id) {
          const invoice = await api.getInvoice(id);
          // resetForm also sets the saved baseline, so Save starts disabled.
          resetForm(invoice.jsonData, invoice.fontId ?? null);
        } else {
          const source = await api.getInvoice(duplicateOf);
          // A duplicate is unsaved work from the start, so it stays dirty:
          // set the data without moving the baseline.
          setFormData(clearedForDuplicate(source.jsonData));
          setFontId(source.fontId ?? null);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, duplicateOf, resetForm, setFormData, setFontId]);

  /** Returns the saved invoice id, or null when validation or the request failed. */
  const handleSave = async () => {
    const errors = [];
    const meta = formData.sections?.metadata?.fields || {};
    if (!meta.refNo?.trim()) errors.push('Reference number is required');
    if (!meta.client?.trim()) errors.push('Client name is required');
    if (grandTotal <= 0) errors.push('Grand total must be greater than 0');
    if (errors.length) {
      errors.forEach((msg) => toast.error(msg));
      return null;
    }

    setSaving(true);
    try {
      if (id) {
        await api.updateInvoice(id, { jsonData: formData, fontId });
        markPristine();
        toast.success('Invoice saved');
        return id;
      }
      const result = await api.createInvoice({ jsonData: formData, fontId });
      toast.success('Invoice saved');
      // Switching to the edit route reloads the saved invoice, which rebaselines
      // the form and disables Save again.
      navigate(`/invoices/${result.id}/edit`, { replace: true });
      return result.id;
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save invoice');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    let invoiceId = id;
    if (!invoiceId || isDirty) {
      invoiceId = await handleSave();
      if (!invoiceId) return;
    }
    window.open(api.getInvoicePdfUrl(invoiceId), '_blank');
  };

  return (
    <EditorLayout
      title={id ? 'Edit Invoice' : 'New Invoice'}
      loading={loading}
      headerActions={
        <>
          <Button onClick={handleSave} disabled={saving || !isDirty} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </>
      }
      {...invoiceForm}
    />
  );
}
