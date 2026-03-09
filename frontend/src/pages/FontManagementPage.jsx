import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import FontCard from "@/components/fonts/FontCard";
import FontUploadDialog from "@/components/fonts/FontUploadDialog";
import { toast } from "sonner";

export default function FontManagementPage() {
  const [fonts, setFonts] = useState([]);
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFonts = useCallback(async () => {
    try {
      const data = await api.getFonts();
      setFonts(data);
    } catch (err) {
      console.error("Failed to fetch fonts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFonts();
  }, [fetchFonts]);

  const handleDelete = async (font) => {
    if (font.source === "system") return;
    try {
      await api.deleteFont(font.id);
      fetchFonts();
      toast.success('Font deleted');
    } catch (err) {
      console.error("Failed to delete font:", err);
      toast.error('Failed to delete font');
    }
  };

  const handleFontAdded = () => {
    fetchFonts();
    toast.success('Font added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fonts</h1>
          <p className="text-muted-foreground">Manage available fonts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add Font
        </Button>
      </div>

      <Input
        placeholder="Type preview text..."
        value={previewText}
        onChange={(e) => setPreviewText(e.target.value)}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : fonts.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No fonts found. Add your first font to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fonts.map((font) => (
            <FontCard
              key={font.id}
              font={font}
              previewText={previewText}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <FontUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onFontAdded={handleFontAdded}
      />
    </div>
  );
}
