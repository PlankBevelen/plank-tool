import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import Icon from '@/lib/icon';
import client from '@/api/client';

type OutputFormat = 'keep' | 'jpeg' | 'png' | 'webp' | 'avif';

type CompressApiResult = {
  url: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  width: number;
  height: number;
  format: string;
};

type ZipApiResult = {
  url: string;
  filename: string;
  size: number;
};

interface CompressedResult {
  original: File;
  result?: {
    url: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
    reduction: number;
    width: number;
    height: number;
    format: string;
  };
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  isDownloading?: boolean;
}

export default function ImageCompress() {
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [options, setOptions] = useState({
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'keep' as OutputFormat,
  });

  // Refs for scrolling synchronization
  const leftListRef = useRef<HTMLDivElement>(null);
  const rightListRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling
  useEffect(() => {
    const leftList = leftListRef.current;
    const rightList = rightListRef.current;

    if (!leftList || !rightList) return;

    const handleLeftScroll = () => {
      rightList.scrollTop = leftList.scrollTop;
    };

    const handleRightScroll = () => {
      leftList.scrollTop = rightList.scrollTop;
    };

    leftList.addEventListener('scroll', handleLeftScroll);
    rightList.addEventListener('scroll', handleRightScroll);

    return () => {
      leftList.removeEventListener('scroll', handleLeftScroll);
      rightList.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    // Initialize results with pending status, appending to existing
    const newCompressedFiles = acceptedFiles.map(file => ({
      original: file,
      status: 'pending' as const
    }));
    setCompressedFiles((prev) => [...prev, ...newCompressedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
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

  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setCompressedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompress = async () => {
    if (files.length === 0) return;

    setIsCompressing(true);
    
    const pendingIndices = compressedFiles.map((item, index) => item.status === 'pending' || item.status === 'error' ? index : -1).filter(i => i !== -1);
    
    if (pendingIndices.length === 0) {
        setIsCompressing(false);
        toast.info('所有图片已处理完成');
        return;
    }

    // Update status to processing for pending items
    setCompressedFiles(prev => prev.map((item, index) => 
      pendingIndices.includes(index) ? { ...item, status: 'processing' } : item
    ));

    let successCount = 0;

    for (const index of pendingIndices) {
      // Check if file still exists (it might have been removed during process, though unlikely with blocking UI, but good safety)
      if (!files[index]) continue;

      const file = files[index];
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('quality', options.quality.toString());
        formData.append('maxWidth', options.maxWidth.toString());
        formData.append('maxHeight', options.maxHeight.toString());
        if (options.format !== 'keep') {
          formData.append('format', options.format);
        }
        
        const response = await client.post('/images/compress', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }) as unknown as CompressApiResult; 
        
        setCompressedFiles(prev => {
            const newArr = [...prev];
            // Ensure index is still valid in case of race conditions
            if (newArr[index]) {
                newArr[index] = {
                    original: file,
                    result: response,
                    status: 'success'
                };
            }
            return newArr;
        });
        successCount++;
        
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : (typeof error === 'object' && error && 'message' in error ? String((error as { message?: unknown }).message) : '压缩失败');
        setCompressedFiles(prev => {
            const newArr = [...prev];
            if (newArr[index]) {
                newArr[index] = {
                    original: file,
                    status: 'error',
                    error: message
                };
            }
            return newArr;
        });
        toast.error(`${file.name} 压缩失败`);
      }
    }
    
    setIsCompressing(false);
    
    if (successCount > 0) {
      toast.success(`本次成功压缩 ${successCount} 张图片`);
    }
  };

  const handleDownload = async (item: CompressedResult, index: number) => {
    if (item.status !== 'success' || !item.result) return;
    
    setCompressedFiles(prev => {
      const newArr = [...prev];
      if (newArr[index]) {
        newArr[index] = { ...newArr[index], isDownloading: true };
      }
      return newArr;
    });

    try {
        // Use client to fetch blob for consistent progress/error handling if needed
        // But for direct download, we can use fetch or just anchor if we trust browser.
        // To provide "clear feedback" as requested, let's use fetch so we can show a spinner.
        const response = await fetch(item.result.url);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = item.result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // toast.success('下载已开始'); // Optional, browser download animation is usually enough
    } catch (error) {
        console.error('Download failed:', error);
        toast.error('下载失败');
    } finally {
        setCompressedFiles(prev => {
            const newArr = [...prev];
            if (newArr[index]) {
              newArr[index] = { ...newArr[index], isDownloading: false };
            }
            return newArr;
        });
    }
  };

  const handleDownloadAll = async () => {
    const successIndices = compressedFiles.map((item, idx) => (item.status === 'success' && item.result) ? idx : -1).filter(i => i !== -1);
    
    if (successIndices.length === 0) return;

    // Use ZIP download if more than 1 file, otherwise just download the single file
    if (successIndices.length === 1) {
      const index = successIndices[0];
      handleDownload(compressedFiles[index], index);
      return;
    }

    setIsZipping(true);
    try {
      const filesToZip = successIndices.map(idx => {
          const item = compressedFiles[idx];
          return {
            filename: item.result!.filename,
            originalName: item.original.name
          };
      });

      const response = await client.post('/images/zip', { files: filesToZip }) as unknown as ZipApiResult;
      
      const link = document.createElement('a');
      link.href = response.url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('已开始下载压缩包');
    } catch {
      toast.error('创建压缩包失败');
    } finally {
      setIsZipping(false);
    }
  };

  // Preview helper for original files
  const renderOriginalPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    return (
      <div 
        className="w-16 h-16 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0 relative border border-zinc-200 cursor-pointer group"
        onClick={() => window.open(url, '_blank')}
        title="点击在新窗口预览"
      >
         <img
            src={url}
            alt="original"
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            onLoad={() => URL.revokeObjectURL(url)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <Icon name="image" className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm items-stretch w-min mx-auto ">
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
            <p className="text-xs text-zinc-400 mt-1">支持 JPG, PNG, WebP (最大 10MB)</p>
          </div>
        </div>

        <div className="flex-none w-full md:w-[320px] flex flex-col gap-6 justify-between py-1">
          <div className="space-y-6">
             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 flex justify-between items-center">
                  <span>压缩质量</span>
                  <span className="text-zinc-500 font-mono bg-zinc-100 px-2 py-0.5 rounded text-xs">{options.quality}%</span>
                </label>
                <div className="relative pt-1">
                   <input
                    type="range"
                    min="10"
                    max="100"
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                    className="w-full accent-zinc-900 h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>高压缩</span>
                    <span>高质量</span>
                  </div>
                </div>
             </div>
             
             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">最大宽度限制</label>
                <div className="relative">
                  <input
                    type="number"
                    value={options.maxWidth}
                    onChange={(e) => setOptions({ ...options, maxWidth: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 pr-8 transition-shadow"
                    placeholder="1920"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">px</span>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">最大高度限制</label>
                <div className="relative">
                  <input
                    type="number"
                    value={options.maxHeight}
                    onChange={(e) => setOptions({ ...options, maxHeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 pr-8 transition-shadow"
                    placeholder="1080"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">px</span>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700">输出格式</label>
                <select
                  value={options.format}
                  onChange={(e) => {
                    const v = e.target.value;
                    const format: OutputFormat = v === 'keep' || v === 'jpeg' || v === 'png' || v === 'webp' || v === 'avif' ? v : 'keep';
                    setOptions({ ...options, format });
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

          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isCompressing}
            className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {isCompressing ? (
              <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 正在处理...
              </>
            ) : (
              '开始压缩'
            )}
          </button>
        </div>
      </div>

      {/* 2. Split View */}
      {files.length > 0 && (
        <div className="flex flex-1 gap-6 min-h-[400px] overflow-hidden">
          {/* Left: Original List */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                原始图片 
                <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{files.length}</span>
              </h3>
              <button 
                onClick={() => { setFiles([]); setCompressedFiles([]); }}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                清空列表
              </button>
            </div>
            
            <div 
                ref={leftListRef}
                className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar"
            >
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-zinc-100 rounded-xl shadow-sm hover:border-zinc-200 transition-colors h-[88px] group">
                  {renderOriginalPreview(file)}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <p className="text-sm font-medium text-zinc-900 truncate" title={file.name}>{file.name}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded">{file.type.split('/')[1].toUpperCase()}</span>
                        <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                    className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Result List */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
             <div className="flex items-center justify-between px-1">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                处理结果
                {compressedFiles.some(f => f.status === 'success') && (
                    <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {compressedFiles.filter(f => f.status === 'success').length} 完成
                    </span>
                )}
              </h3>
              {compressedFiles.some(f => f.status === 'success') && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                >
                   {isZipping ? (
                      <>
                         <div className="w-3 h-3 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                         打包中...
                      </>
                   ) : (
                      '下载全部 (ZIP)'
                   )}
                </button>
              )}
            </div>

            <div 
                ref={rightListRef}
                className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar"
            >
               {compressedFiles.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-zinc-100 rounded-xl shadow-sm h-[88px] relative overflow-hidden group">
                    {item.status === 'processing' && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="flex items-center gap-2 text-zinc-600 text-sm font-medium">
                              <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                              处理中...
                          </div>
                        </div>
                    )}
                    
                    {item.status === 'success' && item.result ? (
                      <>
                        <div 
                            className="w-16 h-16 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0 border border-zinc-200 cursor-pointer relative group/img cursor-zoom-in"
                            onClick={() => window.open(item.result!.url, '_blank')}
                            title="点击在新窗口预览"
                        >
                          <img
                            src={item.result.url}
                            alt="compressed"
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                             <Icon name="image" className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-zinc-900">{formatBytes(item.result.compressedSize)}</span>
                             <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              -{item.result.reduction}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span>{item.result.width} x {item.result.height}</span>
                              <span>•</span>
                              <span>{item.result.format.toUpperCase()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(item, idx)}
                          disabled={item.isDownloading}
                          className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                          title="下载"
                        >
                          {item.isDownloading ? (
                             <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
                          ) : (
                             <Icon name="download" className="w-5 h-5" />
                          )}
                        </button>
                      </>
                    ) : item.status === 'error' ? (
                       <div className="w-full h-full flex items-center justify-center text-red-500 text-sm gap-2 bg-red-50/50 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <span>处理失败: {item.error}</span>
                       </div>
                    ) : (
                      // Pending state
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm gap-2 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                         <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                         等待开始
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
