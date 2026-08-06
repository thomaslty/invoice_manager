import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function SignatureUpload({ signature, onChange, readOnly = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('signature', file);
      const result = await api.uploadSignature(formData);
      onChange({ imageUrl: result.url });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onChange({ imageUrl: '' });
  };

  return (
    <div className="space-y-3">
      {/* Label text */}
      <div className="space-y-1.5">
        <Label htmlFor="sig-label" className="text-sm">Label Text</Label>
        <Input
          id="sig-label"
          value={signature.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="For and on behalf of"
          readOnly={readOnly}
        />
      </div>

      {/* Image upload */}
      <div className="space-y-1.5">
        <Label className="text-sm">Signature Image</Label>
        {signature.imageUrl ? (
          <div className="relative inline-block">
            <img
              src={signature.imageUrl}
              alt="Signature"
              className="h-20 border border-border rounded-md object-contain bg-white p-1"
            />
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : !readOnly ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Click to upload signature'}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">No signature</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="sig-name" className="text-sm">Name</Label>
        <Input
          id="sig-name"
          value={signature.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Signatory name"
          className="font-semibold"
          readOnly={readOnly}
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="sig-title" className="text-sm">Title</Label>
        <Input
          id="sig-title"
          value={signature.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Position or title"
          className="italic"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
