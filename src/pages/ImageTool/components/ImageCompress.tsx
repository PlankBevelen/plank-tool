import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import Icon from '@/lib/icon';

export default function ImageCompress() {
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<{ original: File; compressed: File }[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [options, setOptions] = useState({
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setCompressedFiles([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [], // Note: GIF compression might not be fully supported by browser-image-compression
    },
  });

  const handleCompress = async () => {
    if (files.length === 0) return;

    setIsCompressing(true);
    const results = [];

    try {
      for (const file of files) {
        // GIF 特殊处理提示
        if (file.type === 'image/gif') {
          toast.warning('GIF 压缩仅支持静态帧，动态 GIF 可能会丢失动画');
        }

        const compressedFile = await imageCompression(file, options);
        results.push({ original: file, compressed: compressedFile });
      }
      setCompressedFiles(results);
      toast.success('压缩完成');
    } catch (error) {
      console.error(error);
      toast.error('压缩失败，请重试');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = (file: File) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    compressedFiles.forEach(({ compressed }) => handleDownload(compressed));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 拖拽上传区 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Icon name="image" className="w-10 h-10 text-zinc-300" />
          {isDragActive ? (
            <p>释放文件以添加</p>
          ) : (
            <div>
              <p className="text-base font-medium text-zinc-700">点击或拖拽上传图片</p>
              <p className="text-xs mt-1">支持 JPG, PNG, WebP, GIF</p>
            </div>
          )}
        </div>
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">最大尺寸 (MB)</label>
          <input
            type="number"
            step="0.1"
            value={options.maxSizeMB}
            onChange={(e) => setOptions({ ...options, maxSizeMB: Number(e.target.value) })}
            className="px-3 py-1.5 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">最大宽高 (px)</label>
          <input
            type="number"
            value={options.maxWidthOrHeight}
            onChange={(e) => setOptions({ ...options, maxWidthOrHeight: Number(e.target.value) })}
            className="px-3 py-1.5 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isCompressing}
            className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCompressing ? '压缩中...' : '开始压缩'}
          </button>
        </div>
      </div>

      {/* 结果列表 */}
      {compressedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-zinc-900">压缩结果</h3>
            <button
              onClick={handleDownloadAll}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              全部下载
            </button>
          </div>
          <div className="grid gap-4">
            {compressedFiles.map((item, idx) => {
              const saved = ((item.original.size - item.compressed.size) / item.original.size * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-lg">
                  <div className="w-16 h-16 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={URL.createObjectURL(item.compressed)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.original.name}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="line-through">{formatBytes(item.original.size)}</span>
                      <Icon name="right" className="w-3 h-3" />
                      <span className="text-green-600 font-medium">{formatBytes(item.compressed.size)}</span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px]">
                        -{saved}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(item.compressed)}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Icon name="download" className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
