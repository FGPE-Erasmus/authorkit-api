import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { config } from '../../../config';

const MIN_LENGTH = config.validator.password.min_length;

const REGEX_LOWERCASE_LETTER  = '(?=.*[a-z])';
const REGEX_UPPERCASE_LETTER  = '(?=.*[A-Z])';
const REGEX_DIGIT             = '(?=.*\\d)';
const REGEX_SPECIAL_CHARACTER = '(?=.*[@$!%*?&\.,])';
const REGEX_STRONG_PASSWORD   = new RegExp(
    '^' +
    REGEX_LOWERCASE_LETTER +
    REGEX_UPPERCASE_LETTER +
    REGEX_DIGIT +
    REGEX_SPECIAL_CHARACTER +
    '[A-Za-z\\d@$!%*?&\.,-_]' +
    '{' + MIN_LENGTH + ',}$');
const REGEX_WEAK_PASSWORD     = new RegExp(
    '^' +
    '[A-Za-z\\d@$!%*?&\.,-_]' +
    '{' + MIN_LENGTH + ',}$');

@ValidatorConstraint({ name: 'password', async: false })
@Injectable()
export class PasswordValidator implements ValidatorConstraintInterface {

    constructor(
    ) {}

    public validate(text: string) {
        if (config.validator.password.enforce_strong) {
            return REGEX_STRONG_PASSWORD.test(text);
        } else {
            return REGEX_WEAK_PASSWORD.test(text);
        }
    }

    public defaultMessage(args: ValidationArguments) {
        if (config.validator.password.enforce_strong) {
            return 'VALIDATORS.FAILURE_MESSAGES.STRONG_PASSWORD';
        } else {
            return 'VALIDATORS.FAILURE_MESSAGES.WEAK_PASSWORD';
        }
    }
}
