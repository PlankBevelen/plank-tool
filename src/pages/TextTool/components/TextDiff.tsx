import { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { toast } from 'sonner';

export default function TextDiff() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] gap-4">
      <div className="flex items-center justify-end gap-2 px-1">
        <button
          onClick={() => handleCopy(original)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
        >
          复制左侧
        </button>
        <button
          onClick={() => handleCopy(modified)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
        >
          复制右侧
        </button>
        <button
          onClick={() => { setOriginal(''); setModified(''); }}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-colors"
        >
          清空
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 mb-2">左侧文本</div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="粘贴/输入原始文本"
            className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div className="flex-1">
          <div className="text-xs text-zinc-500 mb-2">右侧文本</div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="粘贴/输入修改后文本"
            className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </div>

      <div className="flex-1 border border-zinc-200 rounded-lg overflow-hidden bg-white">
        <DiffEditor
          height="100%"
          language="plaintext"
          original={original}
          modified={modified}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderSideBySide: true,
            wordWrap: 'on',
            ignoreTrimWhitespace: false,
            readOnly: true,
          }}
        />
      </div>
    </div>
  );
}
