import { Field } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';

interface IProps {
  value: string;
  onChange: (newValue: string) => void;
}

function buildInequalityValue(greaterValue: string, lessValue: string) {
  return greaterValue || lessValue ? `${greaterValue}:=:${lessValue}` : '';
}

function InequlityInput({ value, onChange }: IProps) {
  const [greaterValue = '', lessValue = ''] = value.split(':=:');

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field className="gap-1.5">
        <Input
          type="number"
          placeholder="Minimum"
          value={greaterValue}
          onChange={(e) =>
            onChange(buildInequalityValue(e.target.value, lessValue))
          }
        />
      </Field>
      <Field className="gap-1.5">
        <Input
          type="number"
          placeholder="Maximum"
          value={lessValue}
          onChange={(e) =>
            onChange(buildInequalityValue(greaterValue, e.target.value))
          }
        />
      </Field>
    </div>
  );
}

export default InequlityInput;
