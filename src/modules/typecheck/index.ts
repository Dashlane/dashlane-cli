import * as Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import { customizeAjv } from './customize_ajv';

export class TypeCheckError extends Error {
    constructor(
        readonly title: string,
        readonly description: string,
        readonly details?: string,
        message?: string
    ) {
        super(message || `${title}: ${description}`);
    }
}

export class JSONParsingError extends TypeCheckError {
    constructor() {
        super('JSON_PARSING_ERROR', 'JSON could not be parsed');
    }
}

export class JSONValidationError extends TypeCheckError {
    constructor(
        readonly reasonAjv: Ajv.ErrorObject,
        details?: string
    ) {
        super(
            'JSON_VALIDATION_ERROR',
            'JSON did not pass validation',
            details,
            `${reasonAjv.instancePath} ${reasonAjv.message ?? ''}`
        );
    }
}

export type DetailedAjvErrorObject = { errors: Ajv.ErrorObject[]; details: string };

export const detailedErrorReportingOverride = (errors: Ajv.ErrorObject[]): DetailedAjvErrorObject => {
    const details = errors
        .map((obj: Ajv.ErrorObject) => `[${obj.schemaPath}] [${JSON.stringify(obj.params)}] ${obj.message ?? ''}`)
        .join('\n')
        .trim();
    return { errors, details };
};

type JSONSchema = Record<string, unknown>;

export class TypeCheck<T> {
    private validator: Ajv.ValidateFunction;

    constructor(
        schema: JSONSchema,
        readonly errorReportingOverride?: (errors: Ajv.ErrorObject[]) => DetailedAjvErrorObject,
        openApiValidation?: boolean
    ) {
        if (openApiValidation) {
            const ajv = new Ajv2020({
                allErrors: true,
                strict: true,
                strictTypes: false,
                strictRequired: false,
                allowMatchingProperties: true,
            });
            ajv.addFormat('media-range', true); // used in OpenAPI 3.1

            addFormats(ajv);
            customizeAjv(ajv);

            this.validator = ajv.compile(schema);
        } else {
            const ajv = new Ajv.default({ allErrors: true });
            addFormats(ajv);
            customizeAjv(ajv);
            this.validator = ajv.compile(schema);
        }
    }

    public parseAndValidate(str: string): TypeCheckError | T {
        let value: T;
        try {
            value = JSON.parse(str) as T;
        } catch (error) {
            return new JSONParsingError();
        }

        return this.validate(value);
    }

    public validate(object: unknown): TypeCheckError | T {
        if (!this.validator(object) && this.validator.errors) {
            if (this.errorReportingOverride) {
                const { errors, details } = this.errorReportingOverride(this.validator.errors);
                return new JSONValidationError(errors[0], details);
            }
            return new JSONValidationError(this.validator.errors[0]);
        }

        return object as T;
    }
}
