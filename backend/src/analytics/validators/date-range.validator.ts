import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

@ValidatorConstraint({ name: 'validDateRange', async: false })
export class ValidDateRangeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const dto = args.object as { start?: Date | string; end?: Date | string };
    const start = dto.start ? new Date(dto.start) : null;
    const end = dto.end ? new Date(dto.end) : null;

    if (!start && !end) return true;
    if (start && !end) return true;
    if (!start && end) return true;

    if (start! > end!) return false;

    if (end!.getTime() - start!.getTime() > ONE_YEAR_MS) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as { start?: Date | string; end?: Date | string };
    const start = dto.start ? new Date(dto.start) : null;
    const end = dto.end ? new Date(dto.end) : null;

    if (start && end && start > end) {
      return 'start date must be before or equal to end date';
    }
    return 'date range cannot exceed 1 year';
  }
}
