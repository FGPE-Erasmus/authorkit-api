import crypto from 'crypto';
import { CrudRequest } from '@nestjsx/crud';
import { config } from '../../../config';
import { PROGRAMMING_LANGUAGE_EXT } from './programming-language-ext';

export function commonElements(arrays: Array<string[]>): string[] {
    return arrays.shift().reduce(function (res, v) {
        if (res.indexOf(v) === -1 && arrays.every(function (a) {
            return a.indexOf(v) !== -1;
        })) {
            res.push(v);
        }
        return res;
    }, []);
}

export function filterObject(obj: any, predicate: any) {
    return Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => (res[key] = obj[key], res), {});
}

export function dropUnallowed(obj: any, allowed: Array<string>) {
    return Object.keys(obj)
        .filter(key => !allowed.includes(key))
        .forEach((k, i) => {
            delete obj[k];
        });
}

export function ucfirst(string: string) {
    return string[0].toUpperCase() + string.slice(1);
}

export function passwordHash(password: string) {
    return crypto.createHmac('sha256', config.salt)
        .update(password, 'utf8')
        .digest('hex');
}

export function getParamValueFromCrudRequest(req: CrudRequest, param: string) {
    const field = req.parsed.paramsFilter
        .find(
            (attr) =>
                attr.field.toLowerCase() === param.toLowerCase() &&
                attr.operator.toLowerCase() === 'eq'
        );
    return field ? field.value : undefined;
}

export async function asyncForEach(array: any[], callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export function fileExtension(filename: string, opts?) {
    if (!opts) {
        opts = {};
    }
    if (!filename) {
        return '';
    }
    let ext = (/[^./\\]*$/.exec(filename) || [''])[0];
    ext = opts.preserveCase ? ext : ext.toLowerCase();
    return ext;
}

export function languageName(extension: string) {
    if (!extension) {
        return null;
    }
    const language = PROGRAMMING_LANGUAGE_EXT[extension];
    if (!language) {
        return null;
    }
    if (Array.isArray(language)) {
        return language[0];
    }
    return language;
}
