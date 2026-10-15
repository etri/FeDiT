import { registerDecorator, ValidationOptions } from 'class-validator';

export function MaxByteLength(max: number, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'maxByteLength',
      target: object.constructor,
      propertyName,
      constraints: [max],
      options,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= max
          );
        },
        defaultMessage() {
          return `${propertyName} must not exceed ${max} bytes`;
        },
      },
    });
}
