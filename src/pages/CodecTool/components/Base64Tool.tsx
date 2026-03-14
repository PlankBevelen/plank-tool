import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const safeAtob = (b64: string) => {
  const cleaned = b64.replace(/\s+/g, '');
  return atob(cleaned);
};

const safeBtoa = (txt: string) => {
  const bytes = new TextEncoder().encode(txt);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const bytesToText = (binary: string) => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export default function Base64Tool() {
  const [plain, setPlain] = useState('');
  const [b64, setB64] = useState('');
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);

  const decodedText = useMemo(() => {
    if (!b64.trim()) return '';
    try {
      const bin = safeAtob(b64);
      return bytesToText(bin);
    } catch {
      return '';
    }
  }, [b64]);

  const encodedText = useMemo(() => {
    if (!plain) return '';
    try {
      return safeBtoa(plain);
    } catch {
      return '';
    }
  }, [plain]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  const handlePickImage = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('读取失败'));
        reader.readAsDataURL(file);
      });
      setImgDataUrl(dataUrl);
      const base64Part = dataUrl.split(',')[1] || '';
      setB64(base64Part);
      toast.success('已转换为 Base64');
    } catch (e) {
      const message = e instanceof Error ? e.message : '转换失败';
      toast.error(message);
    }
  };

  const previewFromBase64 = useMemo(() => {
    const trimmed = b64.trim();
    if (!trimmed) return null;
    if (/^data:/i.test(trimmed)) return trimmed;
    return null;
  }, [b64]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="text-sm font-medium text-zinc-700">文本 → Base64</div>
        <textarea
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          placeholder="输入要编码的文本"
          className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleCopy(encodedText)}
            disabled={!encodedText}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            复制 Base64
          </button>
          <button
            onClick={() => { setPlain(''); }}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            清空
          </button>
        </div>
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">Base64 输出</div>
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">{encodedText || '-'}</pre>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="text-sm font-medium text-zinc-700">Base64 → 文本 / 图片</div>
        <textarea
          value={b64}
          onChange={(e) => setB64(e.target.value)}
          placeholder="输入 Base64（可直接粘贴 data:image/...;base64,...）"
          className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-sm text-zinc-600">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePickImage(e.target.files?.[0] || null)}
            />
            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 cursor-pointer transition-colors">
              选择图片转 Base64
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(decodedText)}
              disabled={!decodedText}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              复制解码文本
            </button>
            <button
              onClick={() => { setB64(''); setImgDataUrl(null); }}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">解码文本</div>
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">{decodedText || '-'}</pre>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">图片预览</div>
            <div className="p-3">
              {imgDataUrl ? (
                <img src={imgDataUrl} alt="preview" className="max-h-48 max-w-full rounded border border-zinc-200" />
              ) : previewFromBase64 ? (
                <img src={previewFromBase64} alt="preview" className="max-h-48 max-w-full rounded border border-zinc-200" />
              ) : (
                <div className="text-xs text-zinc-400">支持 dataURL 直接预览，或用“选择图片转 Base64”</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
