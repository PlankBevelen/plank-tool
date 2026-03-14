import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import client from '@/api/client';
import Icon from '@/lib/icon';

type StripFormat = 'keep' | 'jpeg' | 'png' | 'webp' | 'avif';

type Meta = {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: unknown;
};

export default function ImageMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripping, setStripping] = useState(false);
  const [stripFormat, setStripFormat] = useState<StripFormat>('keep');
  const [sanitizedUrl, setSanitizedUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setMeta(null);
    setSanitizedUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/avif': [],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.errors[0].code === 'file-too-large') {
          toast.error(`${rejection.file.name} 文件过大 (最大 10MB)`);
        } else {
          toast.error(`${rejection.file.name} 格式不支持`);
        }
      });
    }
  });

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const exifJson = useMemo(() => {
    if (!meta) return '';
    return JSON.stringify(meta.exif ?? null, null, 2);
  }, [meta]);

  const handleFetchMeta = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await client.post('/images/metadata', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as unknown as Meta;
      setMeta(res);
      toast.success('已解析元数据');
    } catch (e) {
      const message = e instanceof Error ? e.message : '解析失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStrip = async () => {
    if (!file) return;
    setStripping(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (stripFormat !== 'keep') formData.append('format', stripFormat);
      const res = await client.post('/images/strip-metadata', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as unknown as { url: string };
      setSanitizedUrl(res.url);
      toast.success('已生成清除元数据的图片');
    } catch (e) {
      const message = e instanceof Error ? e.message : '处理失败';
      toast.error(message);
    } finally {
      setStripping(false);
    }
  };

  const handleDownloadSanitized = async () => {
    if (!sanitizedUrl) return;
    try {
      const response = await fetch(sanitizedUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'sanitized-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('下载失败');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm items-stretch w-min mx-auto">
        <div
          {...getRootProps()}
          className={`flex-1 min-w-[600px] border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3
            ${isDragActive ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'}
          `}
        >
          <input {...getInputProps()} />
          <Icon name="image" className="w-8 h-8 text-zinc-300" />
          <div>
            <p className="text-sm font-medium text-zinc-700">点击或拖拽上传图片</p>
            <p className="text-xs text-zinc-400 mt-1">支持 JPG, PNG, WebP, AVIF (最大 10MB)</p>
          </div>
          {previewUrl && (
            <div className="mt-3 w-full flex justify-center">
              <img
                src={previewUrl}
                alt="preview"
                className="max-h-44 rounded-lg border border-zinc-200"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
            </div>
          )}
        </div>

        <div className="flex-none w-full md:w-[320px] flex flex-col gap-6 justify-between py-1">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700">输出格式（清除元数据时）</label>
              <select
                value={stripFormat}
                onChange={(e) => {
                  const v = e.target.value;
                  const format: StripFormat = v === 'keep' || v === 'jpeg' || v === 'png' || v === 'webp' || v === 'avif' ? v : 'keep';
                  setStripFormat(format);
                }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow"
              >
                <option value="keep">保持原格式</option>
                <option value="webp">WebP（推荐）</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="avif">AVIF</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFetchMeta}
              disabled={!file || loading}
              className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  解析中...
                </>
              ) : (
                '查看 Exif'
              )}
            </button>
            <button
              onClick={handleStrip}
              disabled={!file || stripping}
              className="w-full px-4 py-2.5 bg-zinc-100 text-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {stripping ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-500/30 border-t-zinc-700 rounded-full animate-spin"></div>
                  处理中...
                </>
              ) : (
                '一键清除元数据'
              )}
            </button>
            {sanitizedUrl && (
              <button
                onClick={handleDownloadSanitized}
                className="w-full px-4 py-2.5 bg-zinc-100 text-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Icon name="download" className="w-5 h-5" />
                下载已清除图片
              </button>
            )}
          </div>
        </div>
      </div>

      {meta && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="text-sm font-medium text-zinc-900">基础信息</div>
            <div className="text-sm text-zinc-600">format: <span className="text-zinc-900">{String(meta.format ?? '-')}</span></div>
            <div className="text-sm text-zinc-600">size: <span className="text-zinc-900">{meta.width ?? '-'} x {meta.height ?? '-'}</span></div>
            <div className="text-sm text-zinc-600">channels: <span className="text-zinc-900">{String(meta.channels ?? '-')}</span></div>
            <div className="text-sm text-zinc-600">hasAlpha: <span className="text-zinc-900">{String(meta.hasAlpha ?? '-')}</span></div>
            <div className="text-sm text-zinc-600">orientation: <span className="text-zinc-900">{String(meta.orientation ?? '-')}</span></div>
          </div>

          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900">Exif</div>
              <div className="text-xs text-zinc-500">本地上传，解析在后端完成</div>
            </div>
            <div className="h-[420px]">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={exifJson}
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
      )}
    </div>
  );
}
