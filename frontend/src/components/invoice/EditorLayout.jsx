import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import { api } from '@/lib/api';

export default function EditorLayout({
  title,
  headerActions,
  headerExtra,
  loading,
  readOnly,
  formData,
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
  reorderItem,
  setCurrency,
  grandTotal,
}) {
  const [fonts, setFonts] = useState([]);

  useEffect(() => {
    api.getFonts().then(setFonts).catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left panel — Editor */}
      <div className="w-1/2 flex flex-col border-r border-border min-w-0 min-h-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <h1 className="text-lg font-semibold shrink-0 truncate">{title}</h1>
            {headerExtra}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
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
            reorderItem={reorderItem}
            setCurrency={setCurrency}
            grandTotal={grandTotal}
            fonts={fonts}
            readOnly={readOnly}
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
