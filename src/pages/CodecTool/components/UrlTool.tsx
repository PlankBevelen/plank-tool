import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function UrlTool() {
  const [input, setInput] = useState('');
  const encoded = useMemo(() => {
    if (!input) return '';
    try {
      return encodeURIComponent(input);
    } catch {
      return '';
    }
  }, [input]);
  const decoded = useMemo(() => {
    if (!input) return '';
    try {
      return decodeURIComponent(input);
    } catch {
      return '';
    }
  }, [input]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="text-sm font-medium text-zinc-700">URL Encode / Decode</div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入字符串或 URL 片段"
        className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
            <span>Encode 结果</span>
            <button
              onClick={() => handleCopy(encoded)}
              disabled={!encoded}
              className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              复制
            </button>
          </div>
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">{encoded || '-'}</pre>
        </div>
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
            <span>Decode 结果</span>
            <button
              onClick={() => handleCopy(decoded)}
              disabled={!decoded}
              className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              复制
            </button>
          </div>
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">{decoded || '-'}</pre>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setInput(encoded)}
          disabled={!encoded}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          用 Encode 覆盖输入
        </button>
        <button
          onClick={() => setInput(decoded)}
          disabled={!decoded}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          用 Decode 覆盖输入
        </button>
        <button
          onClick={() => setInput('')}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
        >
          清空
        </button>
      </div>
    </div>
  );
}

