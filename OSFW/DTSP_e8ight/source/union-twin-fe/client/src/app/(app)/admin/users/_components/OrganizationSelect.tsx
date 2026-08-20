import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';

import {
  ORG_NONE_VALUE,
  ORG_OTHER_VALUE,
} from '@/app/(app)/admin/users/_schemas/user.schema';

import type { AdminOrganization } from '@/types/admin';

interface OrganizationSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  organizations: AdminOrganization[];
}

export function OrganizationSelect({
  id,
  value,
  onChange,
  organizations,
}: OrganizationSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="소속 기관을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ORG_NONE_VALUE}>없음</SelectItem>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.name}>
            {org.name}
          </SelectItem>
        ))}
        <SelectItem value={ORG_OTHER_VALUE}>기타</SelectItem>
      </SelectContent>
    </Select>
  );
}
