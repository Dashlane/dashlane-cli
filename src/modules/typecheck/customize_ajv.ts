import Ajv, { SchemaObjCxt, AnySchemaObject, ErrorObject, KeywordDefinition } from 'ajv';
import type { DataValidateFunction, DataValidationCxt } from 'ajv/dist/types';

// https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts#L237
const BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
export const MAX_BASE64_LENGTH = 4096;

interface AddErrorManager {
    instancePath: string;
    schemaPath: string;
    keyword: string;
}

/** Return a function to add error on ajv validate function
 *
 * @param fn The function to add errors to
 * @param params Keyword and params to return with each error
 * @returns
 */
const addErrorManager = (fn: DataValidateFunction, { keyword, instancePath, schemaPath }: AddErrorManager) => {
    const errors: ErrorObject[] = [];
    fn.errors = errors;
    return (message: string, params: { [key: string]: any } = {}) =>
        errors.push({
            instancePath,
            keyword,
            message,
            params,
            schemaPath,
        });
};

/** Extends AJV with our custom format/keyword
 */
export const customizeAjv = (ajv: Ajv) => {
    {
        /* Keyword: base64 */

        const keywordBase64 = 'base64';
        const compileBase64 = (
            schema: boolean,
            parentSchema: AnySchemaObject,
            it: SchemaObjCxt
        ): DataValidateFunction => {
            const dataValidationFunction = (
                data: any,
                dataCxt?: DataValidationCxt<string | number> | undefined
            ): boolean => {
                if (schema !== true) {
                    // No validation when `base64` keyword is not true
                    return true;
                }
                const pushError = addErrorManager(dataValidationFunction, {
                    keyword: keywordBase64,
                    instancePath: dataCxt?.instancePath ?? '',
                    schemaPath: it.schemaPath.toString(),
                });
                const maxLength = parentSchema.maxLength as number;
                const minLength = parentSchema.minLength as number;
                if (minLength === undefined) {
                    pushError('Missing minLength property');
                    return false;
                } else if (minLength % 4 !== 0) {
                    pushError('minLength should be a multiple of 4', { minLength });
                    return false;
                } else if (!maxLength) {
                    pushError('Missing maxLength property');
                    return false;
                } else if (maxLength > MAX_BASE64_LENGTH) {
                    pushError('maxLength is too high', {
                        maxLength,
                        MAX_BASE64_LENGTH,
                    });
                    return false;
                } else if (parentSchema.maxLength % 4 !== 0) {
                    pushError('maxLength should be a multiple of 4', { maxLength });
                    return false;
                } else if (typeof data !== 'string') {
                    pushError('Must be a string', { dataType: typeof data });
                    return false;
                } else if (data.length % 4 !== 0) {
                    pushError('Length should be a multiple of 4', { dataLength: data.length });
                    return false;
                } else if (!BYTE.test(data)) {
                    pushError('Should satisfy the given regular expression', { regexp: BYTE });
                    return false;
                }
                return true;
            };
            return dataValidationFunction;
        };
        const base64KeywordDefinition: KeywordDefinition = {
            keyword: keywordBase64,
            type: 'string',
            schemaType: 'boolean',
            errors: true,
            schema: true,
            compile: compileBase64,
        };
        ajv.addKeyword(base64KeywordDefinition);

        /* Keyword: url */

        const keywordUrl = 'url';
        const compileUrl = (
            schema: boolean,
            _parentSchema: AnySchemaObject,
            it: SchemaObjCxt
        ): DataValidateFunction => {
            const dataValidationFunction = (
                data: any,
                dataCxt?: DataValidationCxt<string | number> | undefined
            ): boolean => {
                if (schema !== true) {
                    // No validation when `url` keyword is not true
                    return true;
                }
                const pushError = addErrorManager(dataValidationFunction, {
                    keyword: keywordUrl,
                    instancePath: dataCxt?.instancePath ?? '',
                    schemaPath: it.schemaPath.toString(),
                });
                if (typeof data !== 'string') {
                    pushError('Must be a string', { dataType: typeof data });
                    return false;
                }
                let url;
                try {
                    url = new URL(data);
                } catch {
                    pushError('Must be a valid url');
                    return false;
                }
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    pushError('Should be using either http or https as protocol', { currentProtocol: url.protocol });
                    return false;
                }
                return true;
            };
            return dataValidationFunction;
        };
        const urlKeywordDefinition: KeywordDefinition = {
            keyword: keywordUrl,
            type: 'string',
            schemaType: 'boolean',
            errors: true,
            schema: true,
            compile: compileUrl,
        };
        ajv.addKeyword(urlKeywordDefinition);
    }
};
