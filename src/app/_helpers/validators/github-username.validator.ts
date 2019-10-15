import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

const REGEX_GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

@ValidatorConstraint({ name: 'github-username', async: false })
@Injectable()
export class GithubUsernameValidator implements ValidatorConstraintInterface {

    constructor(
    ) {}

    public validate(text: string) {
        return REGEX_GITHUB_USERNAME.test(text);
    }

    public defaultMessage(args: ValidationArguments) {
        return 'VALIDATORS.FAILURE_MESSAGES.GITHUB_USERNAME';
    }
}
