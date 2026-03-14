import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Algo = 'md5' | 'sha1' | 'sha256';

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));
const add32 = (a: number, b: number) => (a + b) >>> 0;

const md5 = (message: string) => {
  const msg = new TextEncoder().encode(message);
  const origLen = msg.length;
  const bitLen = origLen * 8;

  const withOne = origLen + 1;
  const padLen = (withOne % 64 <= 56) ? (56 - (withOne % 64)) : (56 + 64 - (withOne % 64));
  const totalLen = withOne + padLen + 8;

  const buffer = new Uint8Array(totalLen);
  buffer.set(msg, 0);
  buffer[origLen] = 0x80;

  const view = new DataView(buffer.buffer);
  view.setUint32(totalLen - 8, bitLen >>> 0, true);
  view.setUint32(totalLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  for (let offset = 0; offset < totalLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true);

    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F = 0, g = 0;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }

      const tmp = D;
      D = C;
      C = B;
      const x = add32(add32(add32(A, F), K[i]), M[g]);
      B = add32(B, rotl(x, s[i]));
      A = tmp;
    }

    a0 = add32(a0, A);
    b0 = add32(b0, B);
    c0 = add32(c0, C);
    d0 = add32(d0, D);
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return toHex(out);
};

const digest = async (algo: Algo, text: string) => {
  if (algo === 'md5') return md5(text);
  const data = new TextEncoder().encode(text);
  const webAlgo = algo === 'sha1' ? 'SHA-1' : 'SHA-256';
  const hash = new Uint8Array(await crypto.subtle.digest(webAlgo, data));
  return toHex(hash);
};

export default function HashTool() {
  const [algo, setAlgo] = useState<Algo>('sha256');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(() => {
    if (algo === 'md5') return 'MD5';
    if (algo === 'sha1') return 'SHA-1';
    return 'SHA-256';
  }, [algo]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!input) { setOutput(''); setError(null); return; }
      try {
        const res = await digest(algo, input);
        if (!cancelled) { setOutput(res); setError(null); }
      } catch (e) {
        const message = e instanceof Error ? e.message : '计算失败';
        if (!cancelled) { setOutput(''); setError(message); }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [algo, input]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-medium text-zinc-700">哈希计算</div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          {(['md5', 'sha1', 'sha256'] as Algo[]).map((id) => (
            <button
              key={id}
              onClick={() => setAlgo(id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                algo === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
              }`}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`输入要计算 ${label} 的文本`}
        className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      />

      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
          <span>{label}（hex）</span>
          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button
              onClick={handleCopy}
              disabled={!output}
              className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              复制
            </button>
          </div>
        </div>
        <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">{output || '-'}</pre>
      </div>
    </div>
  );
}
