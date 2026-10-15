import { useEffect, useRef, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { Plus, X } from 'lucide-react';

interface QueryParamRow {
  key: string;
  value: string;
}

interface AgentQueryParamsEditorProps {
  url: string;
  onUrlChange: (url: string) => void;
}

function splitUrl(url: string) {
  const index = url.indexOf('?');
  return index < 0
    ? { base: url, query: '' }
    : { base: url.slice(0, index), query: url.slice(index + 1) };
}

function parseRows(url: string): QueryParamRow[] {
  const { query } = splitUrl(url);
  return [...new URLSearchParams(query).entries()].map(([key, value]) => ({
    key,
    value,
  }));
}

function buildUrl(base: string, rows: QueryParamRow[]) {
  const params = new URLSearchParams();
  rows.forEach(({ key, value }) => {
    if (key.trim() !== '') params.append(key.trim(), value);
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function AgentQueryParamsEditor({
  url,
  onUrlChange,
}: AgentQueryParamsEditorProps) {
  const [rows, setRows] = useState<QueryParamRow[]>(() => parseRows(url));
  const emittedUrl = useRef(url);

  useEffect(() => {
    if (url !== emittedUrl.current) {
      emittedUrl.current = url;
      setRows(parseRows(url));
    }
  }, [url]);

  const commit = (next: QueryParamRow[]) => {
    setRows(next);
    const nextUrl = buildUrl(splitUrl(url).base, next);
    emittedUrl.current = nextUrl;
    onUrlChange(nextUrl);
  };

  const updateRow = (index: number, patch: Partial<QueryParamRow>) =>
    commit(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>쿼리 파라미터</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows([...rows, { key: '', value: '' }])}
        >
          <Plus className="size-3.5" />
          추가
        </Button>
      </div>
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="key (예: serviceKey)"
                value={row.key}
                onChange={(e) => updateRow(index, { key: e.target.value })}
              />
              <Input
                placeholder="value"
                value={row.value}
                onChange={(e) => updateRow(index, { value: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="파라미터 제거"
                onClick={() => commit(rows.filter((_, i) => i !== index))}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <FieldDescription>
        인증 키(serviceKey, apikey 등)처럼 URL 뒤에 붙는 값을 따로 적으면 위 URL
        한 줄로 합쳐져 저장됩니다. Agent는 이 URL 한 줄로 요청합니다. 헤더 방식
        토큰은 아직 지원하지 않습니다.
      </FieldDescription>
    </Field>
  );
}
