'use client';

import { useEffect, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import { useDebounce } from '@e8ight/ui/hooks';
import { Search } from 'lucide-react';

import { useUsersPageStore } from '@/app/(app)/admin/users/_stores/useUsersPageStore';

export default function UserSearch() {
  const setSearch = useUsersPageStore((s) => s.setSearch);
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    setSearch(debouncedValue);
  }, [debouncedValue, setSearch]);

  return (
    <InputGroup className="w-full sm:w-72">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="이름 또는 이메일로 검색..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputGroup>
  );
}
