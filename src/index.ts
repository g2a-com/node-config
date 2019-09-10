import { ValidationError } from '@g2a/standard-error';
import Ajv, { Options as AjvOptions } from 'ajv';
import jsonschema, { JSONSchema } from 'json-schema-ref-parser';
import camelCase from 'lodash.camelcase';
import kebabCase from 'lodash.kebabcase';
import snakeCase from 'lodash.snakecase';

enum JSON_SCHEMA_KEYS {
  'sourceFormat' = 'x-sourceFormat',
  'sourceKey' = 'x-sourceKey'
}

export const TRANSFORM_FUNCTIONS: {
  [k: string]: (text?: string) => string
} = {
  'camel-case': camelCase,
  'snake-case': snakeCase,
  'kebab-case': kebabCase
};

export const FORMATS = Object.keys(TRANSFORM_FUNCTIONS);

export type LoadParams = {
  data: {
    [key: string]: unknown;
  },
  schemaPath: string,
}

export type JSONSchemaWithFormat = JSONSchema & {
  [JSON_SCHEMA_KEYS.sourceFormat]?: string;
}

type UnflattenParams = {
  data: Map<string, any>;
  keyPrefix?: string;
  schema: JSONSchemaWithFormat;
  transformCaseFn: (text: string) => string;
}

type MapParams = {
  transformCaseFn: UnflattenParams['transformCaseFn'];
  source: object;
}

/**
 * Loads and validates configuration form environment variables based on provided json schema.
 */
export async function loadFromEnvironment<T> ({ schemaPath }: { schemaPath: string }): Promise<T> {
  return load({ schemaPath, data: process.env });
}

/**
 * Loads and validates configuration form data based on provided json schema.
 */
export async function load<T> ({ schemaPath, data }: LoadParams): Promise<T> {
  const schema: JSONSchemaWithFormat = await jsonschema.dereference(schemaPath);

  // get function that will transform keys
  const transformCaseFn = getTransformFunction(schema[JSON_SCHEMA_KEYS.sourceFormat]);

  const mappedData = objectToMap({ source: data, transformCaseFn });

  // map data from source to json schema format
  const config = unflattenUsingSchema({ schema, data: mappedData, transformCaseFn });

  coerceConfig(schema, config);
  return config;
}

/**
 * unflattenUsingSchema takes schema, data and keyPrefix to return nested object with values
 * @param schema
 * @param data
 * @param keyPrefix
 */
function unflattenUsingSchema ({ schema, data, keyPrefix = '', transformCaseFn }: UnflattenParams): any {
  if (schema.type === 'object') {
    return Object.entries(schema.properties || {})
      .map(([propertyKey, propertyValue]) => {
        // create key with prefix (for nested objects)
        const key = transformCaseFn(`${keyPrefix}_${propertyKey}`);
        const sourceKey = transformCaseFn(propertyValue[JSON_SCHEMA_KEYS.sourceKey]);

        // if property has sourceKey then get value by it if not try to get value by key
        const value = propertyValue[JSON_SCHEMA_KEYS.sourceKey] ? data.get(sourceKey) : data.get(key);

        // truthy value means that we have value for this property and no need to go deeper
        if (value !== undefined) {
          return [propertyKey, value];
        }

        // if object, dig down until we will be able to get value
        const nestedValue = unflattenUsingSchema({
          schema: propertyValue,
          data,
          keyPrefix: key,
          transformCaseFn
        });
        return [propertyKey, nestedValue];
      })
      .reduce((acc, [k, v]) => ({
        ...acc,
        [k as string]: v
      }), {});
  }
}

function coerceConfig (schema: object, data: object, ajvOpts: AjvOptions = {}): void {
  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    ...ajvOpts
  });

  const isValid = ajv.validate(schema, data);

  if (!isValid) {
    throw new ValidationError('Invalid configuration', {
      errors: (ajv.errors || []).map(err => ({
        message: `config${err.dataPath} ${err.message}`,
        field: `config${err.dataPath}`,
        data: err.params
      }))
    });
  }
}

/**
 *  return proper transformation function for key
 * @param format
 */
function getTransformFunction (format: string | undefined): (text: string | undefined) => string {
  if (!format) {
    return camelCase;
  }

  const transformFn = TRANSFORM_FUNCTIONS[format];
  if (transformFn) {
    return transformFn;
  }

  return camelCase;
}

/**
 * objectToMap iterates over entries and return Map
 * @param source
 */
function objectToMap ({ source, transformCaseFn }: MapParams): Map<string, any> {
  return Object
    .entries(source)
    .reduce((acc, [k, v]) => acc.set(transformCaseFn(k), v), new Map());
}
