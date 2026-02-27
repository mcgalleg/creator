'use client';

import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useArtifactCopy() {
  const ref = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);

  const copyAsImage = useCallback(async () => {
    const el = ref.current;
    if (!el) return;

    setIsCopying(true);
    try {
      const { snapdom } = await import('@zumer/snapdom');

      // Pass the blob Promise directly to ClipboardItem for Safari compatibility
      const blobPromise = snapdom.toBlob(el, { type: 'png', scale: 2 }) as Promise<Blob>;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise }),
      ]);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy as image:', err);
      toast.error('Failed to copy image');
    } finally {
      setIsCopying(false);
    }
  }, []);

  const downloadAsPng = useCallback(async (filename = 'artifact') => {
    const el = ref.current;
    if (!el) return;

    setIsCopying(true);
    try {
      const { snapdom } = await import('@zumer/snapdom');
      const blob = await snapdom.toBlob(el, { type: 'png', scale: 2 }) as Blob;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Downloaded PNG');
    } catch (err) {
      console.error('Failed to download PNG:', err);
      toast.error('Failed to download image');
    } finally {
      setIsCopying(false);
    }
  }, []);

  const copyAsText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy text');
    }
  }, []);

  return { ref, copyAsImage, downloadAsPng, copyAsText, isCopying };
}
