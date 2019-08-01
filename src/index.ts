import Ajv, { Options as AjvOptions } from 'ajv';
import camelCase from 'lodash.camelcase';
import { ValidationError } from '@g2a/standard-error';
import jsonschema from 'json-schema-ref-parser';

export type LoadParams = {
  schemaPath: string,
  data: {
    [key: string]: any;
  }
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
  const schema = await jsonschema.dereference(schemaPath);
  const mappedData = objectToMap(data);
  const config = unflattenUsingSchema(schema, mappedData);
  coerceConfig(schema, config);
  return config;
}

/**
 * unflattenUsingSchema takes schema, data and keyPrefix to return nested object with values
 * @param schema
 * @param data
 * @param keyPrefix
 */
function unflattenUsingSchema (schema: jsonschema.JSONSchema, data: Map<string, any>, keyPrefix: string = ''): any {
  if (schema.type === 'object') {
    return Object.entries(schema.properties || {})
      .map(([k, v]) => {
        // create key with prefix (for nested objects)
        const key = camelCase(`${keyPrefix}_${k}`);

        // if property has x-sourceKey then get value by it if not try to get value by key
        const value = v['x-sourceKey'] ? data.get(camelCase(v['x-sourceKey'])) : data.get(key);

        // truthy value means that we have value for this property and no need to go deeper
        if (value !== undefined) {
          return [k, value];
        }

        // if object, dig down until we will be able to get value
        return [k, unflattenUsingSchema(v, data, key)];
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
 * objectToMap iterates over entries and return Map
 * @param source
 */
function objectToMap (source: object): Map<string, any> {
  return Object
    .entries(source)
    .reduce((acc, [k, v]) => acc.set(camelCase(k), v), new Map());
}
