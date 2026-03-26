import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function InvoicePreview({ formData, fontId }) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const html = await api.getPreviewHtml({ jsonData: formData, fontId });
        setPreviewHtml(html);
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [formData, fontId]);

  return (
    <div className="flex flex-col items-center bg-muted/50 p-6 overflow-hidden h-full">
      {loading && (
        <div className="text-xs text-muted-foreground mb-2">Updating preview...</div>
      )}
      <div className="shadow-lg">
        <iframe
          srcDoc={previewHtml}
          className="w-[595px] h-[842px] bg-white border-0"
          title="Invoice Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
