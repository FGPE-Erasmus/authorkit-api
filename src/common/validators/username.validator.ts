import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { I18nService } from 'nestjs-i18n';

@ValidatorConstraint({ name: 'username', async: false })
export class UsernameValidator implements ValidatorConstraintInterface {

    constructor(
        private readonly i18n: I18nService,
    ) {}

    public validate(text: string) {
        return /^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/.test(text);
    }

    public defaultMessage(args: ValidationArguments) {
        return this.i18n.translate('en-gb', 'VALIDATORS.FAILURE_MESSAGES.USERNAME');
    }
}
