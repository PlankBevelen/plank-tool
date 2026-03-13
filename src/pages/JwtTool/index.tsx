import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import Icon from '@/lib/icon';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';

const b64UrlToBytes = (b64url: string) => {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const str = atob(base64 + pad);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
};

const bytesToB64Url = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const tryParseJson = (bytes: Uint8Array) => {
  try {
    const txt = new TextDecoder().decode(bytes);
    return { ok: true as const, value: JSON.parse(txt), raw: txt };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'Invalid JSON' };
  }
};

const formatUnixSeconds = (v: unknown) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const d = new Date(v * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
};

export default function JwtTool() {
  const { favorites, toggleFavorite, isLoggedIn } = useUserStore();
  const isFav = favorites.includes('jwt');
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyResult, setVerifyResult] = useState<'unknown' | 'valid' | 'invalid' | 'unsupported'>('unknown');

  const parts = useMemo(() => token.trim().split('.').filter(Boolean), [token]);
  const headerDecoded = useMemo(() => {
    if (parts.length < 2) return null;
    return tryParseJson(b64UrlToBytes(parts[0]));
  }, [parts]);
  const payloadDecoded = useMemo(() => {
    if (parts.length < 2) return null;
    return tryParseJson(b64UrlToBytes(parts[1]));
  }, [parts]);

  const headerObj = headerDecoded && headerDecoded.ok ? headerDecoded.value : null;
  const payloadObj = payloadDecoded && payloadDecoded.ok ? payloadDecoded.value : null;

  const alg = useMemo(() => {
    if (!headerObj || typeof headerObj !== 'object') return null;
    return (headerObj as any).alg ?? null;
  }, [headerObj]);

  const expText = useMemo(() => formatUnixSeconds((payloadObj as any)?.exp), [payloadObj]);
  const iatText = useMemo(() => formatUnixSeconds((payloadObj as any)?.iat), [payloadObj]);
  const nbfText = useMemo(() => formatUnixSeconds((payloadObj as any)?.nbf), [payloadObj]);
  const isExpired = useMemo(() => {
    const exp = (payloadObj as any)?.exp;
    if (typeof exp !== 'number') return null;
    return Date.now() >= exp * 1000;
  }, [payloadObj]);

  useEffect(() => {
    setVerifyResult('unknown');
  }, [token, secret]);

  const handleFavorite = () => {
    if (!isLoggedIn) { toast.error('请先登录'); return; }
    toggleFavorite('jwt');
    toast.success(isFav ? '已取消收藏' : '收藏成功');
  };

  const handleVerify = async () => {
    const trimmed = token.trim();
    const ps = trimmed.split('.');
    if (ps.length !== 3) {
      toast.error('JWT 必须是 3 段（header.payload.signature）');
      return;
    }
    if (!secret) {
      toast.error('请输入密钥（HS256）');
      return;
    }
    if (!headerObj || typeof headerObj !== 'object') {
      toast.error('Header 解析失败');
      return;
    }
    if ((headerObj as any).alg !== 'HS256') {
      setVerifyResult('unsupported');
      toast.error('仅支持 HS256 验签');
      return;
    }

    try {
      const data = new TextEncoder().encode(`${ps[0]}.${ps[1]}`);
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
      const computed = bytesToB64Url(sig);
      const ok = computed === ps[2];
      setVerifyResult(ok ? 'valid' : 'invalid');
      if (ok) toast.success('签名验证通过');
      else toast.error('签名不匹配');
    } catch (e: any) {
      setVerifyResult('invalid');
      toast.error(e?.message || '验签失败');
    }
  };

  const headerJson = headerDecoded?.ok ? JSON.stringify(headerDecoded.value, null, 2) : '';
  const payloadJson = payloadDecoded?.ok ? JSON.stringify(payloadDecoded.value, null, 2) : '';

  return (
    <div className="p-6 md:p-10 mx-auto">
      <div className="flex items-center mb-8">
        <div className="mr-12">
          <h1 className="text-zinc-900">JWT 工具</h1>
          <p className="text-sm text-zinc-500 mt-0.5">解析 Header/Payload，检查过期，并支持 HS256 验签</p>
        </div>
        <button
          onClick={handleFavorite}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all border
            ${isFav ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-zinc-400 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'}`}
        >
          <Icon name='star' className="w-5 h-5" />
          <span>{isFav ? '已收藏' : '收藏'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-zinc-700">JWT</div>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="粘贴 JWT（header.payload.signature）"
              className="w-full h-36 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            {parts.length > 0 && parts.length !== 3 && (
              <div className="text-xs text-red-500">当前分段数：{parts.length}（应为 3 段）</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700">HS256 密钥（可选）</div>
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="输入 secret 用于验签"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-700">签名状态</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerify}
                  className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
                >
                  验签
                </button>
                <span className={`text-sm ${
                  verifyResult === 'valid' ? 'text-green-600' :
                  verifyResult === 'invalid' ? 'text-red-500' :
                  verifyResult === 'unsupported' ? 'text-amber-600' :
                  'text-zinc-500'
                }`}>
                  {verifyResult === 'valid' ? '通过' :
                    verifyResult === 'invalid' ? '不匹配' :
                    verifyResult === 'unsupported' ? '不支持该算法' :
                    '未验证'}
                </span>
              </div>
              <div className="text-xs text-zinc-400">验签基于浏览器 WebCrypto，不会上传 token/secret</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs text-zinc-500">alg</div>
              <div className="text-sm font-medium text-zinc-900">{String(alg ?? '-')}</div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs text-zinc-500">exp</div>
              <div className="text-sm font-medium text-zinc-900">{expText ?? '-'}</div>
              {isExpired !== null && (
                <div className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                  {isExpired ? '已过期' : '未过期'}
                </div>
              )}
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
              <div className="text-xs text-zinc-500">iat / nbf</div>
              <div className="text-xs text-zinc-900 mt-0.5">iat: {iatText ?? '-'}</div>
              <div className="text-xs text-zinc-900">nbf: {nbfText ?? '-'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Header</span>
                {!headerDecoded ? null : headerDecoded.ok ? (
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(headerJson); toast.success('已复制'); }}
                    className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded"
                  >
                    复制
                  </button>
                ) : (
                  <span className="text-xs text-red-500">{headerDecoded.error}</span>
                )}
              </div>
              <div className="h-[180px]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={headerJson}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">Payload</span>
                {!payloadDecoded ? null : payloadDecoded.ok ? (
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(payloadJson); toast.success('已复制'); }}
                    className="text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded"
                  >
                    复制
                  </button>
                ) : (
                  <span className="text-xs text-red-500">{payloadDecoded.error}</span>
                )}
              </div>
              <div className="h-[220px]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={payloadJson}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

