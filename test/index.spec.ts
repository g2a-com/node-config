import 'jest';
import { load, loadFromEnvironment } from './../src/index';

describe('config', function () {
  it('should load config as json schema from process.env object (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    process.env = {
      ...process.env,
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarUsername: 'user',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarTimeoutInMs: '100'
    };

    const config = await loadFromEnvironment({ schemaPath });

    expect(config).toMatchObject({
      database: expect.objectContaining({
        connectionString: process.env.databaseConnectionString,
        poolSize: process.env.databasePoolSize && parseInt(process.env.databasePoolSize, 10)
      }),
      foobar: expect.objectContaining({
        username: process.env.foobarUsername,
        token: process.env.foobarToken,
        uri: process.env.foobarUri,
        timeoutInMs: process.env.foobarTimeoutInMs && parseInt(process.env.foobarTimeoutInMs, 10)
      })
    });
  });

  it('should load config as json schema from source object (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarUsername: 'user',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarTimeoutInMs: '100'
    };

    const config = await load({ schemaPath, data });

    expect(config).toMatchObject({
      database: expect.objectContaining({
        connectionString: data.databaseConnectionString,
        poolSize: parseInt(data.databasePoolSize, 10)
      }),
      foobar: expect.objectContaining({
        username: data.foobarUsername,
        token: data.foobarToken,
        uri: data.foobarUri,
        timeoutInMs: parseInt(data.foobarTimeoutInMs, 10)
      })
    });
  });

  it('should load config as json schema from source object (upper case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      DATABASE_CONNECTION_STRING: 'http://o.oo',
      DATABASE_POOL_SIZE: '9',
      FOOBAR_USERNAME: 'user',
      FOOBAR_TOKEN: 'token',
      FOOBAR_URI: 'https://www.foobar.com/api/v2',
      FOOBAR_TIMEOUT_IN_MS: '100'
    };

    const config = await load({ schemaPath, data });

    expect(config).toMatchObject({
      database: expect.objectContaining({
        connectionString: data.DATABASE_CONNECTION_STRING,
        poolSize: parseInt(data.DATABASE_POOL_SIZE, 10)
      }),
      foobar: expect.objectContaining({
        username: data.FOOBAR_USERNAME,
        token: data.FOOBAR_TOKEN,
        uri: data.FOOBAR_URI,
        timeoutInMs: parseInt(data.FOOBAR_TIMEOUT_IN_MS, 10)
      })
    });
  });

  it('should not throw error on load config from source object (missing non required field)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      DATABASE_CONNECTION_STRING: 'http://o.oo',
      DATABASE_POOL_SIZE: '9',
      FOOBAR_USERNAME: 'user',
      FOOBAR_TOKEN: 'token',
      FOOBAR_URI: 'https://www.foobar.com/api/v2'
    };

    const config = await load({ schemaPath, data });

    expect(config).toMatchObject({
      database: expect.objectContaining({
        connectionString: data.DATABASE_CONNECTION_STRING,
        poolSize: parseInt(data.DATABASE_POOL_SIZE, 10)
      }),
      foobar: expect.objectContaining({
        username: data.FOOBAR_USERNAME,
        token: data.FOOBAR_TOKEN,
        uri: data.FOOBAR_URI
      })
    });
  });

  it('should throw error on load config from source object (missing required field)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarUsername: 'user',
      foobarToken: 'token',
      foobarTimeoutInMs: '100'
    };

    const config = async () => load({ schemaPath, data });

    expect(config()).rejects.toThrowError(Error('Invalid configuration'));
  });

  it('should throw error on root element type different then object', async () => {
    const schemaPath = `test/mocks/json-schema-array.yaml`;
    const data = {
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarUsername: 'user',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarTimeoutInMs: '100'
    };

    const config = async () => load({ schemaPath, data });
    expect(config()).rejects.toThrowError(Error('Invalid configuration'));
  });
});
