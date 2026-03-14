import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import xmlFormatter from 'xml-formatter';

type ConvertType = 'xml' | 'javascript';

const convertOptions: { id: ConvertType; label: string }[] = [
  { id: 'xml', label: 'XML' },
  { id: 'javascript', label: 'JS Object' },
];

const jsonToXml = (obj: unknown) => {
  const toXml = (v: unknown, name: string): string => {
    if (v === null || v === undefined) return `<${name} />`;
    if (typeof v === 'string') return `<${name}>${v}</${name}>`;
    if (typeof v === 'number' || typeof v === 'boolean') return `<${name}>${v}</${name}>`;
    if (Array.isArray(v)) {
      return v.map(item => toXml(item, 'item')).join('');
    }
    if (typeof v === 'object') {
      let xml = '';
      Object.keys(v as object).forEach(key => {
        xml += toXml((v as Record<string, unknown>)[key], key);
      });
      return name ? `<${name}>${xml}</${name}>` : xml;
    }
    return '';
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>${toXml(obj, '')}</root>`;
};

const jsonToJsObj = (obj: unknown) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"(\w+)":/g, '$1:');
};

export default function JsonConvert() {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [targetType, setTargetType] = useState<ConvertType>('xml');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(() => {
    if (!inputCode.trim()) {
      setOutputCode('');
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputCode);
      setError(null);
      let result = '';

      switch (targetType) {
        case 'xml':
          result = jsonToXml(parsed);
          try {
            result = xmlFormatter(result, { 
              indentation: '  ', 
              filter: (node) => node.type !== 'Comment', 
              collapseContent: true, 
              lineSeparator: '\n' 
            });
          } catch (e) {
            console.warn('XML formatting failed:', e);
          }
          break;
        case 'javascript':
          result = jsonToJsObj(parsed);
          break;
      }
      setOutputCode(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid JSON');
      }
    }
  }, [inputCode, targetType]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleCopy = async () => {
    if (!outputCode) return;
    try {
      await navigator.clipboard.writeText(outputCode);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownload = () => {
    if (!outputCode) return;
    try {
      const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted.${targetType === 'javascript' ? 'js' : targetType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('文件下载开始');
    } catch {
      toast.error('下载失败');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] gap-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          {convertOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTargetType(opt.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                targetType === opt.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
              }`}
            >
              转 {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            复制结果
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            下载文件
          </button>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* 输入区域 */}
        <div className="flex-1 flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-500">输入 JSON</span>
            {error && (
              <span className="text-xs text-red-500 truncate max-w-[200px]" title={error}>
                {error}
              </span>
            )}
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={inputCode}
              onChange={(val) => setInputCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>

        {/* 输出区域 */}
        <div className="flex-1 flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50">
            <span className="text-sm font-medium text-zinc-500">
              {convertOptions.find(o => o.id === targetType)?.label} 结果
            </span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={targetType === 'javascript' ? 'javascript' : targetType === 'xml' ? 'xml' : 'plaintext'}
              value={outputCode}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                folding: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
