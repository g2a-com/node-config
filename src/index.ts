import Ajv, { Options as AjvOptions } from 'ajv';
import camelCase from 'lodash.camelcase';
import { ValidationError } from '@g2a/standard-error';
import jsonschema from 'json-schema-ref-parser';

/**
 * Loads and validates configuration form environment variables based on provided json schema.
 */
export async function loadFromEnvironment<T> (opts: { schemaPath: string }): Promise<T> {
  const schema = await jsonschema.dereference(opts.schemaPath);
  const config = unflattenUsingSchema(schema, process.env);
  coerceConfig(schema, config);
  return config;
}

function unflattenUsingSchema (schema: jsonschema.JSONSchema, data: Record<string, any>): any {
  if (schema.type === 'object') {
    return Object.entries(schema.properties || {})
      .filter(([propName, propSchema]) => !!Object.keys(data).find(k => camelCase(k).startsWith(propName)))
      .map(([propName, propSchema]) => [ propName, unflattenUsingSchema(
        propSchema,
        Object.entries(data)
          .map(([k, v]) => [camelCase(k), v])
          .filter(([k, v]) => k.startsWith(propName))
          .map(([k, v]) => [k.slice(propName.length), v] as [string, any])
          .reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {})
      ) ])
      .reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {});
  } else {
    return data[''];
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
