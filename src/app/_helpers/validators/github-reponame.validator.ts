import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

const REGEX_GITHUB_REPONAME = /^[a-z0-9_.-]{1,100}$/i;

@ValidatorConstraint({ name: 'github-reponame', async: false })
@Injectable()
export class GithubReponameValidator implements ValidatorConstraintInterface {

    constructor(
    ) {}

    public validate(text: string) {
        return REGEX_GITHUB_REPONAME.test(text);
    }

    public defaultMessage(args: ValidationArguments) {
        return 'VALIDATORS.FAILURE_MESSAGES.GITHUB_REPONAME';
    }
}
