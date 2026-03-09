import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fieldConfig = [
  { key: 'date', label: 'Date', placeholder: '30 September, 2022' },
  { key: 'refNo', label: 'Reference No.', placeholder: 'INV-001' },
  { key: 'client', label: 'Client', placeholder: 'Client name or company' },
  { key: 'contactPerson', label: 'Contact Person', placeholder: 'Attn: Contact name' },
  { key: 'jobTitle', label: 'Job Title', placeholder: 'Project or job description' },
];

export default function MetadataFields({ fields, onChange }) {
  return (
    <div className="space-y-3">
      {fieldConfig.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`metadata-${key}`} className="text-sm">
            {label}
          </Label>
          <Input
            id={`metadata-${key}`}
            value={fields[key] || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
          />
        </div>
      ))}
    </div>
  );
}
