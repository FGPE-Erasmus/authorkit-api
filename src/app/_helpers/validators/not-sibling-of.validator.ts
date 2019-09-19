import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
    Validator
} from 'class-validator';
import { Injectable } from '@nestjs/common';

const validator = new Validator();

// Define new constraint that checks the existence of sibling properties
@ValidatorConstraint({ name: 'not-sibling-of', async: false })
@Injectable()
class NotSiblingOfConstraint implements ValidatorConstraintInterface {

    constructor(
    ) {}

    validate(value: any, args: ValidationArguments) {
        if (validator.isDefined(value)) {
            return this.getFailedConstraints(args).length === 0;
        }
        return true;
    }

    getFailedConstraints(args: ValidationArguments) {
        return args.constraints.filter((prop) => validator.isDefined(args.object[prop]));
    }
}

// Create Decorator for the constraint that was just created
function NotSiblingOf(props: string[], validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: props,
            validator: NotSiblingOfConstraint
        });
    };
}

export {
    NotSiblingOfConstraint,
    NotSiblingOf
};
