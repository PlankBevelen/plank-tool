import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const genUuid = () => {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export default function UuidTool() {
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState(0);

  const uuids = useMemo(() => {
    const n = Math.max(1, Math.min(500, Number(count) || 1));
    return Array.from({ length: n }, () => genUuid());
  }, [count, seed]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-medium text-zinc-700">UUID v4 批量生成</div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-600">数量</div>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            max={500}
            className="w-[90px] px-3 py-1.5 rounded-md border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
          >
            重新生成
          </button>
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            复制全部
          </button>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
          输出（每行一个）
        </div>
        <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-[380px] overflow-auto custom-scrollbar">
          {uuids.join('\n')}
        </pre>
      </div>
    </div>
  );
}
