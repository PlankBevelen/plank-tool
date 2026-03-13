import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const escapeUnicode = (input: string, onlyNonAscii: boolean) => {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (onlyNonAscii && code <= 0x7f) {
      out += ch;
      continue;
    }
    if (code <= 0xffff) out += `\\u${code.toString(16).padStart(4, '0')}`;
    else out += `\\u{${code.toString(16)}}`;
  }
  return out;
};

const unescapeUnicode = (input: string) => {
  const withBraces = input.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
    const code = parseInt(hex, 16);
    if (!Number.isFinite(code)) return _;
    return String.fromCodePoint(code);
  });
  const withU = withBraces.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
  });
  const withX = withU.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
    const code = parseInt(hex, 16);
    return String.fromCharCode(code);
  });
  return withX;
};

export default function UnicodeTool() {
  const [input, setInput] = useState('');
  const [onlyNonAscii, setOnlyNonAscii] = useState(true);

  const escaped = useMemo(() => escapeUnicode(input, onlyNonAscii), [input, onlyNonAscii]);
  const unescaped = useMemo(() => {
    if (!input) return '';
    try {
      return unescapeUnicode(input);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-medium text-zinc-700">Unicode 转换</div>
        <label className="text-sm text-zinc-600 flex items-center gap-2">
          <input type="checkbox" checked={onlyNonAscii} onChange={(e) => setOnlyNonAscii(e.target.checked)} />
          仅转非 ASCII
        </label>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入文本或 \\uXXXX / \\u{XXXX} / \\xXX"
        className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
            <span>转义结果</span>
            <button
              onClick={() => handleCopy(escaped)}
              disabled={!escaped}
              className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              复制
            </button>
          </div>
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">{escaped || '-'}</pre>
        </div>
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
            <span>反转义结果</span>
            <button
              onClick={() => handleCopy(unescaped)}
              disabled={!unescaped}
              className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              复制
            </button>
          </div>
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">{unescaped || '-'}</pre>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setInput(escaped)}
          disabled={!escaped}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          用转义覆盖输入
        </button>
        <button
          onClick={() => setInput(unescaped)}
          disabled={!unescaped}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          用反转义覆盖输入
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

