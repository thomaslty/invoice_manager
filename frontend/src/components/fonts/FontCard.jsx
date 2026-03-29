import { useEffect, useId } from "react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";

const SOURCE_VARIANT = {
  system: "secondary",
  remote: "outline",
  local: "default",
};

export default function FontCard({ font, previewText, onDelete }) {
  const uniqueId = useId();
  const fontFaceId = `font-${font.id}-${uniqueId}`;

  useEffect(() => {
    if (font.source === "system") return;

    let cleanup = () => {};

    if (font.source === "local" && font.filePath) {
      const style = document.createElement("style");
      style.dataset.fontId = fontFaceId;
      style.textContent = `
        @font-face {
          font-family: '${fontFaceId}';
          src: url('${font.filePath}');
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
      cleanup = () => style.remove();
    } else if (font.source === "remote" && font.url) {
      if (font.url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = font.url;
        link.dataset.fontId = fontFaceId;
        document.head.appendChild(link);
        cleanup = () => link.remove();
      } else {
        const style = document.createElement("style");
        style.dataset.fontId = fontFaceId;
        style.textContent = `
          @font-face {
            font-family: '${fontFaceId}';
            src: url('${font.url}');
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
        cleanup = () => style.remove();
      }
    }

    return cleanup;
  }, [font.source, font.filePath, font.url, fontFaceId]);

  const getFontFamily = () => {
    if (font.source === "system") {
      return font.family || font.name;
    }
    if (font.source === "remote" && font.url?.endsWith(".css")) {
      return font.family || font.name;
    }
    return `'${fontFaceId}', sans-serif`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="font-bold truncate">{font.name}</span>
          <Badge variant={SOURCE_VARIANT[font.source] || "secondary"}>
            {font.source}
          </Badge>
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!font.canDelete}
            onClick={() => onDelete?.(font)}
            aria-label={`Delete font ${font.name}`}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p
          className="text-lg leading-relaxed min-h-[3rem]"
          style={{ fontFamily: getFontFamily() }}
        >
          {previewText}
        </p>
      </CardContent>
    </Card>
  );
}
