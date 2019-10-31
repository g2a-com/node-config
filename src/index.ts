import { ValidationError } from '@g2a/standard-error'
import Ajv, { ErrorObject, Options as AjvOptions } from 'ajv'
import jsonschema, { JSONSchema } from 'json-schema-ref-parser'
import camelCase from 'lodash.camelcase'
import get from 'lodash.get'
import kebabCase from 'lodash.kebabcase'
import merge from 'lodash.merge'
import snakeCase from 'lodash.snakecase'

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
}

export const FORMATS = Object.keys(TRANSFORM_FUNCTIONS)

export interface LoadParams {
  data: {
    [key: string]: unknown
  }
  schemaPath: string
}

export interface LoadBySchemaParams {
  data: {
    [key: string]: unknown
  }
  schema: JSONSchemaWithFormat
}

export type JSONSchemaWithFormat = JSONSchema & {
  [JSON_SCHEMA_KEYS.sourceFormat]?: string
}

interface UnflattenParams {
  data: Map<string, any>
  keyPrefix?: string
  schema: JSONSchemaWithFormat
  transformCaseFn: (text: string) => string
}

interface MapParams {
  transformCaseFn: UnflattenParams['transformCaseFn']
  source: object
}

/**
 * Loads and validates configuration form environment variables based on provided json schema.
 */
export async function loadFromEnvironment<T> ({ schemaPath }: { schemaPath: string }): Promise<T> {
  return load({ schemaPath, data: process.env })
}

/**
 * Loads and validates configuration form data based on provided json schema.
 */
export async function load<T> ({ schemaPath, data }: LoadParams): Promise<T> {
  const schema: JSONSchemaWithFormat = await jsonschema.dereference(schemaPath)
  return loadBySchema({ schema, data })
}

/**
 * Loads and validates configuration form data based on already provided json schema.
 */
export async function loadBySchema<T> ({ schema, data }: LoadBySchemaParams): Promise<T> {
  // get function that will transform keys
  const transformCaseFn = getTransformFunction(schema[JSON_SCHEMA_KEYS.sourceFormat])

  const mappedData = objectToMap({ source: data, transformCaseFn })

  // map data from source to json schema format
  const config = unflattenUsingSchema({ schema, data: mappedData, transformCaseFn })

  coerceConfig(schema, config)
  return config
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
        const key = transformCaseFn(`${keyPrefix}_${propertyKey}`)
        const sourceKey = transformCaseFn(propertyValue[JSON_SCHEMA_KEYS.sourceKey])

        // if property has sourceKey then get value by it if not try to get value by key
        const value = propertyValue[JSON_SCHEMA_KEYS.sourceKey] ? data.get(sourceKey) : data.get(key)

        // truthy value means that we have value for this property and no need to go deeper
        if (value !== undefined) {
          return [propertyKey, value]
        }

        // if object, dig down until we will be able to get value
        const nestedValue = unflattenUsingSchema({
          schema: propertyValue,
          data,
          keyPrefix: key,
          transformCaseFn
        })
        return [propertyKey, nestedValue]
      })
      .reduce((acc, [k, v]) => ({
        ...acc,
        [k as string]: v
      }), {})
  }
}

function coerceConfig (schema: object, data: object, ajvOpts: AjvOptions = {}): void {
  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    verbose: true,
    ...ajvOpts
  })

  const isValid = ajv.validate(schema, data)

  if (!isValid && ajv.errors) {
    // enrich errors for proper main message
    const enrichedErrors = ajv.errors.map((err) => enrichErrorMessage(err))

    throw new ValidationError(ajv.errorsText(enrichedErrors) || 'Invalid configuration', {
      errors: (enrichedErrors).map((err) => ({
        message: ajv.errorsText([err]),
        field: `data${err.dataPath}`,
        data: err.params
      }))
    })
  }
}

/**
 *  return proper transformation function for key
 * @param format
 */
function getTransformFunction (format: string | undefined): (text: string | undefined) => string {
  if (!format) {
    return camelCase
  }

  const transformFn = TRANSFORM_FUNCTIONS[format]
  if (transformFn) {
    return transformFn
  }

  return camelCase
}

/**
 * objectToMap iterates over entries and return Map
 * @param source
 */
function objectToMap ({ source, transformCaseFn }: MapParams): Map<string, any> {
  return Object
    .entries(source)
    .reduce((acc, [k, v]) => acc.set(transformCaseFn(k), v), new Map())
}

function enrichErrorMessage (err: Ajv.ErrorObject): ErrorObject {
  // create deep copy of err object to not mutate later
  const error = merge({}, err)

  Object.entries(error.params).forEach(([key, value]: [string, any]) => {
    let propertySchema: object | undefined = error.parentSchema

    if (error.keyword === 'required') {
      propertySchema = get(error.parentSchema, `properties.${value}`)
    }

    const sourceKey = get(propertySchema, JSON_SCHEMA_KEYS.sourceKey)
    if (sourceKey && error.message) {
      error.message = `${error.message} with source key: "${sourceKey}"`
    }
  })
  return error
}
