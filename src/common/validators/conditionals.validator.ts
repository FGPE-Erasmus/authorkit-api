import { Validator } from 'class-validator';

/**
 * Conditions' functions for ValidateIf
 */

const validator = new Validator();

// Helper function for determining if a prop should be validated
function incompatibleSiblingsNotPresent(incompatibleSiblings: string[]) {
    return (o: { [x: string]: any; }, v: any) => {
        return Boolean(
            // Validate if prop has value
            validator.isDefined(v) ||
            // Validate if all incompatible siblings are not defined
            incompatibleSiblings.every((prop) => !validator.isDefined(o[prop])),
        );
    };
}

export {
    incompatibleSiblingsNotPresent,
};
