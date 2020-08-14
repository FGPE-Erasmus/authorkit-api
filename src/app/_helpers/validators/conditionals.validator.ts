import { Validator, isDefined } from 'class-validator';

/**
 * Conditions' functions for ValidateIf
 */

// Helper function for determining if a prop should be validated
function incompatibleSiblingsNotPresent(incompatibleSiblings: string[]) {
    return (o: { [x: string]: any; }, v: any) => {
        return Boolean(
            // Validate if prop has value
            isDefined(v) ||
            // Validate if all incompatible siblings are not defined
            incompatibleSiblings.every((prop) => !isDefined(o[prop]))
        );
    };
}

export {
    incompatibleSiblingsNotPresent
};
