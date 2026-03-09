import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SectionToggle({ label, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
