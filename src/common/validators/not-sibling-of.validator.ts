import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
    Validator,
} from 'class-validator';
import { I18nService } from 'nestjs-i18n';

const validator = new Validator();

// Define new constraint that checks the existence of sibling properties
@ValidatorConstraint({ name: 'not-sibling-of', async: false })
class NotSiblingOfConstraint implements ValidatorConstraintInterface {

    constructor(
        private readonly i18n: I18nService,
    ) {}

    validate(value: any, args: ValidationArguments) {
        if (validator.isDefined(value)) {
            return this.getFailedConstraints(args).length === 0;
        }
        return true;
    }

    defaultMessage(args: ValidationArguments) {
        return this.i18n.translate('en-gb', 'VALIDATORS.FAILURE_MESSAGES.NOT_SIBLING_OF', {
            property: args.property,
            siblings: this.getFailedConstraints(args).join(', '),
        });
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
            validator: NotSiblingOfConstraint,
        });
    };
}

export {
    NotSiblingOfConstraint,
    NotSiblingOf,
};
