import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInvoiceForm } from '@/hooks/useInvoiceForm';
import EditorLayout from '@/components/invoice/EditorLayout';
import { api } from '@/lib/api';
import { PencilIcon } from 'lucide-react';

export default function TemplateViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceForm = useInvoiceForm();
  const { setFormData, setFontId } = invoiceForm;

  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    async function loadData() {
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

  return (
    <EditorLayout
      title={`Template: ${templateName}`}
      loading={loading}
      readOnly
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/templates/${id}/edit`)}
        >
          <PencilIcon className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      }
      {...invoiceForm}
    />
  );
}
