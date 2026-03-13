import { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

type Target = 'typescript' | 'go';

const targets: { id: Target; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
];

const isValidTsIdentifier = (key: string) => /^[A-Za-z_$][\w$]*$/.test(key);

const toPascalCase = (input: string) => {
  const cleaned = input
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join('');
  if (!cleaned) return 'Field';
  if (/^\d/.test(cleaned)) return `Field${cleaned}`;
  return cleaned;
};

type ShapeField = {
  optional: boolean;
  types: Set<string>;
};

const unionTypes = (types: Iterable<string>) => {
  const set = new Set<string>();
  for (const t of types) {
    const parts = t.split('|').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) set.add(p);
  }
  const arr = Array.from(set);
  arr.sort((a, b) => a.localeCompare(b));
  return arr.join(' | ');
};

const parenIfUnion = (t: string) => (t.includes(' | ') ? `(${t})` : t);

const mergeObjectShapes = (objs: Record<string, unknown>[]) => {
  const fields = new Map<string, ShapeField>();
  for (const obj of objs) {
    const keys = Object.keys(obj);
    for (const k of keys) {
      if (!fields.has(k)) fields.set(k, { optional: false, types: new Set<string>() });
    }
  }

  for (const [k, f] of fields.entries()) {
    for (const obj of objs) {
      if (!(k in obj)) {
        f.optional = true;
        continue;
      }
      const v = (obj as any)[k] as unknown;
      if (v === null) f.types.add('null');
    }
  }

  return fields;
};

const inferTs = (value: unknown, nameHint: string, ctx: {
  interfaces: Map<string, Map<string, { optional: boolean; type: string }>>;
  order: string[];
  seen: Set<string>;
}): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'any';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    const allObjects = value.every((v) => v && typeof v === 'object' && !Array.isArray(v));
    if (allObjects) {
      const objs = value as Record<string, unknown>[];
      const shape = mergeObjectShapes(objs);
      const ifaceName = `${nameHint}Item`;
      if (!ctx.interfaces.has(ifaceName)) {
        ctx.interfaces.set(ifaceName, new Map());
        ctx.order.push(ifaceName);
      }
      const iface = ctx.interfaces.get(ifaceName)!;

      for (const [k, f] of shape.entries()) {
        const types = new Set<string>();
        for (const obj of objs) {
          if (!(k in obj)) continue;
          const v = obj[k];
          types.add(inferTs(v, `${ifaceName}${toPascalCase(k)}`, ctx));
        }
        if (types.size === 0) types.add('any');
        if (f.types.has('null')) types.add('null');
        iface.set(k, { optional: f.optional, type: unionTypes(types) });
      }
      return `${ifaceName}[]`;
    }

    const elementTypes = new Set<string>();
    for (const v of value) elementTypes.add(inferTs(v, `${nameHint}Item`, ctx));
    const u = unionTypes(elementTypes);
    return `${parenIfUnion(u)}[]`;
  }

  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const ifaceName = nameHint;
    if (!ctx.interfaces.has(ifaceName)) {
      ctx.interfaces.set(ifaceName, new Map());
      ctx.order.push(ifaceName);
    }
    const iface = ctx.interfaces.get(ifaceName)!;

    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const propType = inferTs(v, `${ifaceName}${toPascalCase(k)}`, ctx);
      const optional = v === null;
      const existing = iface.get(k);
      if (!existing) {
        iface.set(k, { optional, type: propType });
      } else {
        const merged = unionTypes([existing.type, propType]);
        iface.set(k, { optional: existing.optional || optional, type: merged });
      }
    }
    return ifaceName;
  }

  return 'any';
};

const generateTsInterfaces = (rootValue: unknown, rootName: string) => {
  const ctx = {
    interfaces: new Map<string, Map<string, { optional: boolean; type: string }>>(),
    order: [] as string[],
    seen: new Set<string>(),
  };
  const rootType = inferTs(rootValue, rootName, ctx);

  const lines: string[] = [];
  for (const name of ctx.order) {
    const iface = ctx.interfaces.get(name);
    if (!iface) continue;
    lines.push(`export interface ${name} {`);

    const keys = Array.from(iface.keys());
    keys.sort((a, b) => a.localeCompare(b));
    for (const k of keys) {
      const f = iface.get(k)!;
      const propName = isValidTsIdentifier(k) ? k : JSON.stringify(k);
      const optionalMark = f.optional ? '?' : '';
      lines.push(`  ${propName}${optionalMark}: ${f.type};`);
    }
    lines.push('}');
    lines.push('');
  }

  if (typeof rootType === 'string' && !ctx.interfaces.has(rootType)) {
    lines.push(`export type ${rootName} = ${rootType};`);
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
};

type GoField = {
  name: string;
  type: string;
  tag: string;
};

const goPrimitive = (v: unknown) => {
  if (v === null || v === undefined) return 'any';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'number') return 'float64';
  if (typeof v === 'boolean') return 'bool';
  return 'any';
};

const goTypeFromUnion = (types: string[]) => {
  const uniq = Array.from(new Set(types));
  if (uniq.length === 1) return uniq[0];
  if (uniq.length === 2 && uniq.includes('null')) {
    const t = uniq.find((x) => x !== 'null')!;
    if (t.startsWith('[]')) return t;
    if (t === 'any') return 'any';
    return `*${t}`;
  }
  return 'any';
};

const inferGo = (value: unknown, nameHint: string, ctx: {
  structs: Map<string, GoField[]>;
  order: string[];
}): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'any';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]any';
    const allObjects = value.every((v) => v && typeof v === 'object' && !Array.isArray(v));
    if (allObjects) {
      const itemName = `${nameHint}Item`;
      const objs = value as Record<string, unknown>[];
      generateGoStructFromObjects(itemName, objs, ctx);
      return `[]${itemName}`;
    }
    const elementTypes = value.map((v) => inferGo(v, `${nameHint}Item`, ctx));
    const merged = goTypeFromUnion(elementTypes);
    return `[]${merged === 'null' ? 'any' : merged}`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    generateGoStructFromObjects(nameHint, [obj], ctx);
    return nameHint;
  }
  return goPrimitive(value);
};

const generateGoStructFromObjects = (structName: string, objs: Record<string, unknown>[], ctx: {
  structs: Map<string, GoField[]>;
  order: string[];
}) => {
  if (!ctx.structs.has(structName)) {
    ctx.structs.set(structName, []);
    ctx.order.push(structName);
  }

  const shape = mergeObjectShapes(objs);
  const fields: GoField[] = [];
  const keys = Array.from(shape.keys()).sort((a, b) => a.localeCompare(b));

  for (const k of keys) {
    const shapeField = shape.get(k)!;
    const types: string[] = [];
    for (const obj of objs) {
      if (!(k in obj)) continue;
      const v = obj[k];
      if (v === null) {
        types.push('null');
        continue;
      }
      const inferred = inferGo(v, `${structName}${toPascalCase(k)}`, ctx);
      types.push(inferred);
    }
    if (types.length === 0) types.push('any');
    if (shapeField.types.has('null')) types.push('null');

    const goType = goTypeFromUnion(types);
    const goName = toPascalCase(k);
    const optional = shapeField.optional || types.includes('null');
    const tag = optional ? `json:"${k},omitempty"` : `json:"${k}"`;
    fields.push({ name: goName, type: goType === 'null' ? 'any' : goType, tag });
  }

  ctx.structs.set(structName, fields);
};

const generateGoStructs = (rootValue: unknown, rootName: string) => {
  const ctx = { structs: new Map<string, GoField[]>(), order: [] as string[] };
  const rootType = inferGo(rootValue, rootName, ctx);
  const lines: string[] = [];
  lines.push('package main');
  lines.push('');
  lines.push('type any = interface{}');
  lines.push('');

  for (const name of ctx.order) {
    const fields = ctx.structs.get(name);
    if (!fields) continue;
    lines.push(`type ${name} struct {`);
    for (const f of fields) {
      lines.push(`  ${f.name} ${f.type} \`${f.tag}\``);
    }
    lines.push('}');
    lines.push('');
  }

  if (rootType !== rootName && !ctx.structs.has(rootType)) {
    lines.push(`type ${rootName} = ${rootType}`);
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
};

export default function JsonTypeGen() {
  const [target, setTarget] = useState<Target>('typescript');
  const [rootName, setRootName] = useState('Root');
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const normalizedRootName = useMemo(() => {
    const n = toPascalCase(rootName);
    return n || 'Root';
  }, [rootName]);

  const handleGenerate = useCallback(() => {
    if (!inputCode.trim()) {
      setOutputCode('');
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(inputCode);
      setError(null);
      const code = target === 'typescript'
        ? generateTsInterfaces(parsed, normalizedRootName)
        : generateGoStructs(parsed, normalizedRootName);
      setOutputCode(code);
    } catch (e: any) {
      setOutputCode('');
      setError(e?.message || 'Invalid JSON');
    }
  }, [inputCode, normalizedRootName, target]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

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
    const ext = target === 'typescript' ? 'ts' : 'go';
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${normalizedRootName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] gap-4">
      <div className="flex items-center justify-between px-1 gap-3 flex-wrap">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          {targets.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTarget(opt.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                target === opt.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-500">根类型名</div>
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="w-[180px] px-3 py-1.5 rounded-md border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            placeholder="Root"
          />
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

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-500">输入 JSON</span>
            {error && (
              <span className="text-xs text-red-500 truncate max-w-[300px]" title={error}>
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

        <div className="flex-1 flex flex-col border border-zinc-200 rounded-lg overflow-hidden bg-white">
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50">
            <span className="text-sm font-medium text-zinc-500">输出</span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={target === 'typescript' ? 'typescript' : 'go'}
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

