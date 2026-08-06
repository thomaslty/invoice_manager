import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { PencilIcon, CopyIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { resetForm } = invoiceForm;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const invoice = await api.getInvoice(id);
        resetForm(invoice.jsonData, invoice.fontId ?? null);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, resetForm]);

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
            onClick={() => navigate(`/invoices/new?from=${id}`)}
          >
            <CopyIcon className="h-4 w-4 mr-1.5" />
            Duplicate
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
