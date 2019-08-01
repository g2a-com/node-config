import 'jest';
import { load, loadFromEnvironment } from './../src/index';

describe('config', function () {
  it('should load config as json schema from process.env object (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    process.env = {
      ...process.env,
      customKey: '100000',
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarUsername: 'user',
      reConnectingString: 'redis://192.1.1.1/2',
      reConnectingString2: 'redis://192.1.1.1/3'
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
        timeoutInMs: process.env.foobarTimeoutInMs && parseInt(process.env.foobarTimeoutInMs, 10),
        customKey: 100000,
        store: expect.objectContaining({
          redis: process.env.foobarStoreRedis,
          redisExternal: process.env.reConnectingString2
        })
      }),
      redis: process.env.reConnectingString,
      isEnabled: true
    });
  });

  it('should load config (with sourceKey) as json schema from process.env object (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    process.env = {
      ...process.env,
      customKey: '100000',
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarUsername: 'user',
      reConnectingString: 'redis://192.1.1.1/2',
      reConnectingString2: 'redis://192.1.1.1/3'
    };

    const config = await loadFromEnvironment({ schemaPath });

    expect(config).toMatchObject({
      redis: process.env.reConnectingString,
      foobar: expect.objectContaining({
        customKey: 100000,
        store: expect.objectContaining({
          redis: process.env.foobarStoreRedis,
          redisExternal: process.env.reConnectingString2
        })
      })
    });
  });

  it('should load config as json schema from source object (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      customKey: '100000',
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarUsername: 'user',
      reConnectingString: 'redis://192.1.1.1/2',
      reConnectingString2: 'redis://192.1.1.1/3'
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
        timeoutInMs: parseInt(data.foobarTimeoutInMs, 10),
        customKey: 100000,
        store: expect.objectContaining({
          redis: data.foobarStoreRedis,
          redisExternal: data.reConnectingString2
        })
      }),
      redis: data.reConnectingString,
      isEnabled: true
    });
  });

  it('should load config as json schema from source object with false, 0 and undefined values (camel case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      customKey: 0,
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: 0,
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarUsername: 'user',
      reConnectingString: 'redis://192.1.1.1/2',
      reConnectingString2: undefined,
      isEnabled: false
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
        timeoutInMs: 0,
        customKey: 0,
        store: expect.objectContaining({
          redis: data.foobarStoreRedis,
          redisExternal: data.reConnectingString2
        })
      }),
      redis: data.reConnectingString,
      isEnabled: false
    });
  });

  it('should load config as json schema from source object (upper case)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      CUSTOM_KEY: '100000',
      DATABASE_CONNECTION_STRING: 'http://o.oo',
      DATABASE_POOL_SIZE: '9',
      FOOBAR_STORE_REDIS: 'redis://192.1.1.1/1',
      FOOBAR_TIMEOUT_IN_MS: '100',
      FOOBAR_TOKEN: 'token',
      FOOBAR_URI: 'https://www.foobar.com/api/v2',
      FOOBAR_USERNAME: 'user',
      RE_CONNECTING_STRING: 'redis://192.1.1.1/2',
      RE_CONNECTING_STRING2: 'redis://192.1.1.1/3'
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
        timeoutInMs: parseInt(data.FOOBAR_TIMEOUT_IN_MS, 10),
        customKey: 100000,
        store: expect.objectContaining({
          redis: data.FOOBAR_STORE_REDIS,
          redisExternal: data.RE_CONNECTING_STRING2
        })
      }),
      redis: data.RE_CONNECTING_STRING,
      isEnabled: true
    });
  });

  it('should not throw error on load config from source object (missing non required field)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      CUSTOM_KEY: '100000',
      DATABASE_CONNECTION_STRING: 'http://o.oo',
      DATABASE_POOL_SIZE: '9',
      FOOBAR_STORE_REDIS: 'redis://192.1.1.1/1',
      FOOBAR_TOKEN: 'token',
      FOOBAR_URI: 'https://www.foobar.com/api/v2',
      FOOBAR_USERNAME: 'user',
      RE_CONNECTING_STRING: 'redis://192.1.1.1/2'
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
        customKey: 100000,
        store: expect.objectContaining({
          redis: process.env.foobarStoreRedis
        })
      })
    });
  });

  it('should throw error on load config from source object (missing required field)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {
      customKey: '100000',
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUsername: 'user'
    };

    const config = async () => load({ schemaPath, data });

    expect(config()).rejects.toThrowError(Error('Invalid configuration'));
  });

  it('should throw error on root element type different then object', async () => {
    const schemaPath = `test/mocks/json-schema-array.yaml`;
    const data = {
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUri: 'https://www.foobar.com/api/v2',
      foobarUsername: 'user'
    };

    const config = async () => load({ schemaPath, data });
    expect(config()).rejects.toThrowError(Error('Invalid configuration'));
  });
});
