import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { CopyIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SnapshotViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { setFormData, setFontId } = invoiceForm;

  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const snapshot = await api.getSnapshot(id);
        if (snapshot.jsonData) setFormData(snapshot.jsonData);
        if (snapshot.fontId) setFontId(snapshot.fontId);
        if (snapshot.name) setSnapshotName(snapshot.name);
      } catch (err) {
        console.error('Failed to load snapshot:', err);
        toast.error('Failed to load snapshot');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, setFormData, setFontId]);

  const handleClone = async () => {
    setCloning(true);
    try {
      const newInvoice = await api.cloneSnapshot(id);
      toast.success('Invoice created from snapshot');
      navigate(`/invoices/${newInvoice.id}/edit`);
    } catch (err) {
      console.error('Failed to clone snapshot:', err);
      toast.error('Failed to clone snapshot');
    } finally {
      setCloning(false);
    }
  };

  return (
    <EditorLayout
      title={`Snapshot: ${snapshotName}`}
      loading={loading}
      readOnly
      headerActions={
        <Button onClick={handleClone} disabled={cloning} size="sm">
          {cloning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <CopyIcon className="h-4 w-4 mr-1.5" />
          )}
          Clone to Invoice
        </Button>
      }
      {...invoiceForm}
    />
  );
}
