import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

const DATE_FORMAT = 'd MMMM, yyyy';

const DATE_PARSE_FORMATS = [
  'd MMMM, yyyy',
  'dd MMMM, yyyy',
  'd MMM, yyyy',
  'dd MMM, yyyy',
  'yyyy-MM-dd',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'd/M/yyyy',
  'dd/MM/yyyy',
  'M/d/yyyy',
  'MM/dd/yyyy',
];

function tryParseDate(str) {
  if (!str) return undefined;
  for (const fmt of DATE_PARSE_FORMATS) {
    try {
      const d = parse(str, fmt, new Date());
      if (!isNaN(d.getTime())) return d;
    } catch { /* skip */ }
  }
  // Try native Date parsing as last resort
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return undefined;
}

function DatePickerField({ value, onChange, readOnly }) {
  const [open, setOpen] = useState(false);

  const dateObj = useMemo(() => tryParseDate(value), [value]);

  if (readOnly) {
    return (
      <Input
        id="metadata-date"
        value={value || ''}
        readOnly
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="metadata-date"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-9',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(date) => {
            if (date) {
              onChange('date', format(date, DATE_FORMAT));
            }
            setOpen(false);
          }}
          defaultMonth={dateObj}
        />
      </PopoverContent>
    </Popover>
  );
}

const textFieldConfig = [
  { key: 'refNo', label: 'Reference No.', placeholder: 'INV-001' },
  { key: 'client', label: 'Client', placeholder: 'Client name or company' },
  { key: 'contactPerson', label: 'Contact Person', placeholder: 'Attn: Contact name' },
  { key: 'jobTitle', label: 'Job Title', placeholder: 'Project or job description' },
];

export default function MetadataFields({ fields, onChange, readOnly = false }) {
  return (
    <div className="space-y-3">
      {/* Date picker field */}
      <div className="space-y-1.5">
        <Label htmlFor="metadata-date" className="text-sm">
          Date
        </Label>
        <DatePickerField
          value={fields.date || ''}
          onChange={onChange}
          readOnly={readOnly}
        />
      </div>

      {/* Text fields */}
      {textFieldConfig.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`metadata-${key}`} className="text-sm">
            {label}
          </Label>
          <Input
            id={`metadata-${key}`}
            value={fields[key] || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}
