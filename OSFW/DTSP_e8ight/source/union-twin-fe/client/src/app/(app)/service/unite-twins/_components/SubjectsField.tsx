'use client';

import { useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { X } from 'lucide-react';

interface SubjectsFieldProps {
  value: string[];
  onChange: (subjects: string[]) => void;
  error?: string | undefined;
}

export function SubjectsField({ value, onChange, error }: SubjectsFieldProps) {
  const [draft, setDraft] = useState('');

  function addSubject() {
    const subject = draft.trim();
    if (!subject || value.includes(subject)) return;
    onChange([...value, subject]);
    setDraft('');
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>주제 *</FieldLabel>
      <Input
        value={draft}
        placeholder="주제를 입력하고 Enter를 누르세요"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={addSubject}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          addSubject();
        }}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((subject) => (
            <Badge key={subject} variant="secondary" className="gap-1 py-1">
              {subject}
              <button
                type="button"
                aria-label={`${subject} 주제 삭제`}
                className="hover:text-destructive -my-1 flex size-6 items-center justify-center"
                onClick={() => onChange(value.filter((s) => s !== subject))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
