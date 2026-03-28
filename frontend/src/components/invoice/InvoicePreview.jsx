import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

// A4 at 96dpi (browser default) — matches the 210mm x 297mm in invoice-html.js
const A4_WIDTH = 794; // 210mm * 96/25.4
const A4_HEIGHT = 1123; // 297mm * 96/25.4

export default function InvoicePreview({ formData, fontId }) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef(null);

  // Debounced preview fetch
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

  // Measure container and compute scale
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const padding = 32; // 16px each side
    const availableWidth = width - padding;
    const availableHeight = height - padding;
    const scaleByWidth = availableWidth / A4_WIDTH;
    const scaleByHeight = availableHeight / A4_HEIGHT;
    setScale(Math.min(scaleByWidth, scaleByHeight));
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-start bg-muted/50 h-full overflow-auto p-4"
    >
      {loading && (
        <div className="text-xs text-muted-foreground mb-2 shrink-0">Updating preview...</div>
      )}
      <div
        className="shadow-lg shrink-0"
        style={{
          width: A4_WIDTH * scale,
          height: A4_HEIGHT * scale,
        }}
      >
        <iframe
          srcDoc={previewHtml}
          className="bg-white border-0"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          title="Invoice Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
