import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';

type Level = 'L' | 'M' | 'Q' | 'H';

export default function QRCodeTool() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState<Level>('M');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => text.trim().length > 0, [text]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!canGenerate) {
        setDataUrl('');
        setError(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(text.trim(), {
          errorCorrectionLevel: level,
          width: size,
          margin,
        });
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setDataUrl('');
          setError(e?.message || '生成失败');
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [canGenerate, level, margin, size, text]);

  const handleCopy = async () => {
    if (!dataUrl) return;
    try {
      await navigator.clipboard.writeText(dataUrl);
      toast.success('已复制 DataURL');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownload = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('下载失败');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="text-sm font-medium text-zinc-900">链接生成二维码</div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入链接或任意文本"
          className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700">尺寸</div>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(Math.max(120, Math.min(1024, Number(e.target.value) || 320)))}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700">边距</div>
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(Math.max(0, Math.min(10, Number(e.target.value) || 2)))}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700">容错等级</div>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H</option>
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            disabled={!dataUrl}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            复制 DataURL
          </button>
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            下载 PNG
          </button>
          <button
            onClick={() => setText('')}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center gap-4">
        {dataUrl ? (
          <>
            <img src={dataUrl} alt="qrcode" className="rounded-lg border border-zinc-200" style={{ width: Math.min(size, 420), height: 'auto' }} />
            <div className="text-xs text-zinc-400 break-all w-full">{text.trim()}</div>
          </>
        ) : (
          <div className="text-sm text-zinc-400">输入内容后自动生成二维码</div>
        )}
      </div>
    </div>
  );
}

