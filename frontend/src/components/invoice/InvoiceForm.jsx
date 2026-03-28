import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import SectionToggle from './SectionToggle';
import MetadataFields from './MetadataFields';
import ItemsTable from './ItemsTable';
import SignatureUpload from './SignatureUpload';

function SectionCard({ title, visible, onToggle, children }) {
  return (
    <Collapsible defaultOpen className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
          <ChevronDown className="h-4 w-4 transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
          {title}
        </CollapsibleTrigger>
        <SectionToggle
          label=""
          checked={visible}
          onToggle={onToggle}
        />
      </div>
      <CollapsibleContent>
        {visible && (
          <div className="px-4 pb-4 pt-0">{children}</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function InvoiceForm({
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
  fonts = [],
}) {
  const { sections } = formData;

  return (
    <div className="space-y-3 p-4">
      {/* Header Section */}
      <SectionCard
        title="Header"
        visible={sections.header.visible}
        onToggle={() => toggleSection('header')}
      >
        <div className="space-y-1.5">
          <Label htmlFor="header-title" className="text-sm">Title</Label>
          <Input
            id="header-title"
            value={sections.header.title}
            onChange={(e) => updateSection('header', { title: e.target.value })}
            placeholder="INVOICE"
            className="text-lg font-bold"
          />
        </div>
      </SectionCard>

      {/* Metadata Section */}
      <SectionCard
        title="Invoice Details"
        visible={sections.metadata.visible}
        onToggle={() => toggleSection('metadata')}
      >
        <MetadataFields
          fields={sections.metadata.fields}
          onChange={updateMetadataField}
        />
      </SectionCard>

      {/* Items Section */}
      <SectionCard
        title="Line Items"
        visible={sections.items.visible}
        onToggle={() => toggleSection('items')}
      >
        <ItemsTable
          items={sections.items}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
          onUpdateCategoryName={updateCategoryName}
          onReorderItem={reorderItem}
          onSetCurrency={setCurrency}
          grandTotal={grandTotal}
        />
      </SectionCard>

      {/* Payment Method */}
      <SectionCard
        title="Payment Method"
        visible={sections.paymentMethod.visible}
        onToggle={() => toggleSection('paymentMethod')}
      >
        <div className="space-y-1.5">
          <Label htmlFor="payment-content" className="text-sm">Details</Label>
          <Textarea
            id="payment-content"
            value={sections.paymentMethod.content}
            onChange={(e) => updateSection('paymentMethod', { content: e.target.value })}
            placeholder="Bank transfer details, payment instructions..."
            rows={3}
          />
        </div>
      </SectionCard>

      {/* Terms */}
      <SectionCard
        title="Terms & Conditions"
        visible={sections.terms.visible}
        onToggle={() => toggleSection('terms')}
      >
        <div className="space-y-1.5">
          <Label htmlFor="terms-content" className="text-sm">Content</Label>
          <Textarea
            id="terms-content"
            value={sections.terms.content}
            onChange={(e) => updateSection('terms', { content: e.target.value })}
            placeholder="Payment terms, conditions..."
            rows={3}
          />
        </div>
      </SectionCard>

      {/* Signature */}
      <SectionCard
        title="Signature"
        visible={sections.signature.visible}
        onToggle={() => toggleSection('signature')}
      >
        <SignatureUpload
          signature={sections.signature}
          onChange={(data) => updateSection('signature', data)}
        />
      </SectionCard>

      {/* Footer */}
      <SectionCard
        title="Footer"
        visible={sections.footer.visible}
        onToggle={() => toggleSection('footer')}
      >
        <div className="space-y-1.5">
          <Label htmlFor="footer-content" className="text-sm">Content</Label>
          <Input
            id="footer-content"
            value={sections.footer.content}
            onChange={(e) => updateSection('footer', { content: e.target.value })}
            placeholder="Footer text"
          />
        </div>
      </SectionCard>

      {/* Font Selector */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1.5">
        <Label className="text-sm font-semibold">Font</Label>
        <Select
          value={fontId ? String(fontId) : ''}
          onValueChange={(val) => setFontId(val ? Number(val) : null)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a font (default)" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.id} value={String(font.id)}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
