import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { I18nService } from 'nestjs-i18n';

const MIN_LENGTH = 6;
const MAX_LENGTH = 100;

const REGEX_LOWERCASE_LETTER  = '(?=.*[a-z])';
const REGEX_UPPERCASE_LETTER  = '(?=.*[A-Z])';
const REGEX_DIGIT             = '(?=.*\\d)';
const REGEX_SPECIAL_CHARACTER = '(?=.*[@$!%*?&\.,])';
const REGEX_FULL_PASSWORD     = new RegExp(
    '^' +
    REGEX_LOWERCASE_LETTER +
    REGEX_UPPERCASE_LETTER +
    REGEX_DIGIT +
    REGEX_SPECIAL_CHARACTER +
    '[A-Za-z\\d@$!%*?&\.,]' +
    '{' + MIN_LENGTH + ',' + MAX_LENGTH + '}$');

@ValidatorConstraint({ name: 'password', async: false })
export class PasswordValidator implements ValidatorConstraintInterface {

    constructor(
        private readonly i18n: I18nService,
    ) {}

    public validate(text: string) {
        return REGEX_FULL_PASSWORD.test(text);
    }

    public defaultMessage(args: ValidationArguments) {
        return this.i18n.translate('en-gb', 'VALIDATORS.FAILURE_MESSAGES.PASSWORD');
    }
}
