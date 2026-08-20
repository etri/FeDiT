import { Badge } from '@e8ight/ui/components/ui/badge';

import { getAttributeTypeBadgeStyle } from '@/constants/attributeTypeBadge';

interface IProps {
  type?: string;
}

function EntityAttributeTypeBadge({ type }: IProps) {
  if (!type) {
    return null;
  }

  return (
    <Badge variant="outline" className={getAttributeTypeBadgeStyle(type)}>
      {type}
    </Badge>
  );
}

export default EntityAttributeTypeBadge;
