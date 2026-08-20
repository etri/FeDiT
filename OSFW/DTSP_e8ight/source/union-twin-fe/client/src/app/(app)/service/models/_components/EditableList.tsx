import type { Dispatch, SetStateAction } from 'react';
import type React from 'react';
import { useId, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Plus, X } from 'lucide-react';

interface EditableListProps {
  label: string;
  setState: Dispatch<SetStateAction<string[] | undefined>>;
  propValue?: string[] | undefined;
  isUnable?: boolean;
}

function EditableList({
  label,
  setState,
  propValue,
  isUnable,
}: EditableListProps) {
  const id = useId();
  const [inputState, setInputState] = useState('');
  const listBoxItems = propValue ?? [];

  const addItem = () => {
    const trimmed = inputState.trim();
    if (trimmed === '') {
      return;
    }
    if (listBoxItems.includes(trimmed)) {
      setInputState('');
      toast.warning('Duplicate value.');
      return;
    }
    setState([...listBoxItems, trimmed]);
    setInputState('');
  };

  return (
    <Field>
      <FieldLabel htmlFor={`input-${id}`}>{label}</FieldLabel>
      {!isUnable && (
        <InputGroup>
          <InputGroupInput
            id={`input-${id}`}
            value={inputState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputState(e.target.value)
            }
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === 'Enter' && addItem()
            }
            placeholder="Type and press Enter to add"
          />
          <InputGroupButton variant="outline" size="icon-sm" onClick={addItem}>
            <Plus className="size-4" />
          </InputGroupButton>
        </InputGroup>
      )}
      {listBoxItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {listBoxItems.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
              <span className="max-w-40 truncate">{item}</span>
              {!isUnable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-sm"
                  onClick={() =>
                    setState(listBoxItems.filter((el) => el !== item))
                  }
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove {item}</span>
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </Field>
  );
}

export default EditableList;
