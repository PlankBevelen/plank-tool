import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

export default function JsonFormat() {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEditorChange = (value: string | undefined) => {
    const code = value || '';
    setInputCode(code);
    setError(null);

    if (!code.trim()) {
      setOutputCode('');
      return;
    }

    try {
      const parsed = JSON.parse(code);
      setOutputCode(JSON.stringify(parsed, null, 2));
    } catch (err) {
      // JSON 解析错误时，不更新右侧，但在界面上显示错误信息
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid JSON');
      }
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(inputCode);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputCode(formatted);
      setOutputCode(formatted);
      toast.success('格式化成功');
    } catch {
      toast.error('JSON 格式错误，无法格式化');
    }
  };

  const handleCopy = async () => {
    if (!outputCode) return;
    try {
      await navigator.clipboard.writeText(outputCode);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] gap-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-700 transition-colors"
          >
            格式化
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
          >
            清空
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
        >
          复制结果
        </button>
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
              onChange={handleEditorChange}
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
            <span className="text-sm font-medium text-zinc-500">格式化结果</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={outputCode}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                folding: true, // 启用代码折叠
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
