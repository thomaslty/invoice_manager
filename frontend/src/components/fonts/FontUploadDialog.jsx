import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/** Extract font name from a Google Fonts CSS URL. Returns null for non-Google URLs. */
function parseGoogleFontsUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('googleapis.com') && !parsed.hostname.endsWith('google.com')) return null;
    const family = parsed.searchParams.get('family');
    if (!family) return null;
    // Take everything before the first ':' (weight/style specifiers)
    const name = family.split(':')[0].replace(/\+/g, ' ').trim();
    return name || null;
  } catch {
    return null;
  }
}

export default function FontUploadDialog({ open, onOpenChange, onFontAdded }) {
  const [tab, setTab] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload tab state
  const [file, setFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadFamily, setUploadFamily] = useState("");

  // Remote tab state
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [remoteFamily, setRemoteFamily] = useState("");
  const [multiFontError, setMultiFontError] = useState(false);

  const resetForm = () => {
    setFile(null);
    setUploadName("");
    setUploadFamily("");
    setRemoteUrl("");
    setRemoteName("");
    setRemoteFamily("");
    setMultiFontError(false);
    setError(null);
    setLoading(false);
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !uploadName) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", uploadName);
      if (uploadFamily) formData.append("family", uploadFamily);
      await api.uploadFont(formData);
      onFontAdded?.();
      handleOpenChange(false);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteSubmit = async (e) => {
    e.preventDefault();
    if (!remoteUrl || !remoteName) return;

    setLoading(true);
    setError(null);
    try {
      await api.createFont({
        name: remoteName,
        family: remoteFamily || remoteName,
        source: "remote",
        url: remoteUrl,
      });
      onFontAdded?.();
      handleOpenChange(false);
    } catch (err) {
      setError(err.message || "Failed to add font");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Font</DialogTitle>
          <DialogDescription>
            Upload a font file or add a remote font URL.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
            <TabsTrigger value="remote" className="flex-1">Remote URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="font-file">Font File</Label>
                <Input
                  id="font-file"
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-name">Name</Label>
                <Input
                  id="upload-name"
                  placeholder="e.g. Open Sans Bold"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-family">Family</Label>
                <Input
                  id="upload-family"
                  placeholder="e.g. Open Sans"
                  value={uploadFamily}
                  onChange={(e) => setUploadFamily(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading || !file || !uploadName}>
                  {loading ? "Uploading..." : "Upload Font"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="remote">
            <form onSubmit={handleRemoteSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="remote-url">Font URL</Label>
                <Input
                  id="remote-url"
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                  value={remoteUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setRemoteUrl(url);
                    // Detect multi-font Google Fonts URLs
                    try {
                      const u = new URL(url);
                      if ((u.hostname.endsWith('googleapis.com') || u.hostname.endsWith('google.com')) && u.searchParams.getAll('family').length > 1) {
                        setMultiFontError(true);
                        return;
                      }
                    } catch { /* not a valid URL yet, ignore */ }
                    setMultiFontError(false);
                    const parsed = parseGoogleFontsUrl(url);
                    if (parsed) {
                      if (!remoteName) setRemoteName(parsed);
                      if (!remoteFamily) setRemoteFamily(parsed);
                    }
                  }}
                  required
                />
              </div>
              {multiFontError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Multiple font families detected. Please use a URL with a single font family.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="remote-name">Name</Label>
                <Input
                  id="remote-name"
                  placeholder="e.g. Roboto"
                  value={remoteName}
                  onChange={(e) => setRemoteName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remote-family">Family</Label>
                <Input
                  id="remote-family"
                  placeholder="e.g. Roboto"
                  value={remoteFamily}
                  onChange={(e) => setRemoteFamily(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading || !remoteUrl || !remoteName || multiFontError}>
                  {loading ? "Adding..." : "Add Font"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
