import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const presets: { label: string; pattern: string; flags: string }[] = [
  { label: '邮箱', pattern: String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`, flags: 'g' },
  { label: 'URL', pattern: String.raw`https?:\/\/[^\s/$.?#].[^\s]*`, flags: 'g' },
  { label: 'IPv4', pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b`, flags: 'g' },
  { label: 'UUID v4', pattern: String.raw`\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b`, flags: 'g' },
  { label: 'Hex Color', pattern: String.raw`#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b`, flags: 'g' },
];

export default function RegexTool() {
  const [pattern, setPattern] = useState(String.raw`\b\w+\b`);
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');

  const compiled = useMemo(() => {
    try {
      return { ok: true as const, re: new RegExp(pattern, flags) };
    } catch (e: any) {
      return { ok: false as const, error: e?.message || 'Invalid regex' };
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!compiled.ok) return [];
    const re = compiled.re;
    const useGlobal = re.global ? re : new RegExp(re.source, `${re.flags}g`);
    const out: { index: number; match: string; groups: string[] }[] = [];
    let m: RegExpExecArray | null;
    while ((m = useGlobal.exec(text)) !== null) {
      out.push({ index: m.index, match: m[0], groups: m.slice(1) });
      if (m[0] === '') useGlobal.lastIndex++;
    }
    return out;
  }, [compiled, text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matches.map((m) => `${m.index}: ${m.match}`).join('\n'));
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-medium text-zinc-700">正则表达式测试台</div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-zinc-500">速查</div>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setPattern(p.pattern); setFlags(p.flags); }}
              className="px-2.5 py-1 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3">
        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-700">Pattern</div>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="例如: \\b\\w+\\b"
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-zinc-700">Flags</div>
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^dgimsuy]/g, ''))}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="gim"
          />
        </div>
      </div>

      {!compiled.ok && <div className="text-sm text-red-500">{compiled.error}</div>}

      <div className="space-y-2">
        <div className="text-sm font-medium text-zinc-700">测试文本</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴要匹配的内容"
          className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-zinc-700">
          匹配数：<span className="font-medium">{matches.length}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={matches.length === 0}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            复制匹配
          </button>
          <button
            onClick={() => { setText(''); }}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            清空文本
          </button>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
          匹配列表
        </div>
        <div className="p-3 max-h-[360px] overflow-auto custom-scrollbar space-y-2">
          {matches.length === 0 ? (
            <div className="text-xs text-zinc-400">暂无匹配</div>
          ) : (
            matches.map((m, idx) => (
              <div key={idx} className="text-xs font-mono">
                <div className="text-zinc-500">[{idx + 1}] index={m.index}</div>
                <div className="text-zinc-900 break-all">{m.match}</div>
                {m.groups.length > 0 && (
                  <div className="text-zinc-500 break-all">groups: {m.groups.map((g) => JSON.stringify(g)).join(', ')}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

