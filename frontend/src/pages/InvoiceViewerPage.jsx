import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { PencilIcon, Download } from 'lucide-react';

export default function InvoiceViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { setFormData, setFontId } = invoiceForm;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const invoice = await api.getInvoice(id);
        if (invoice.jsonData) setFormData(invoice.jsonData);
        if (invoice.fontId) setFontId(invoice.fontId);
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, setFormData, setFontId]);

  return (
    <EditorLayout
      title="View Invoice"
      loading={loading}
      readOnly
      headerActions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoices/${id}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(api.getInvoicePdfUrl(id), '_blank')}
          >
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </>
      }
      {...invoiceForm}
    />
  );
}
