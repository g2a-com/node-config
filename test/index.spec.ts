import fs from 'fs';
import 'jest';
import path from 'path';
import { load, loadBySchema, loadFromEnvironment } from './../src/index';

const BASE_JSON_SCHEMA = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'mocks', 'json-schema-base.json')).toString());

describe('config', function () {
  it('should load config from process.env object (camel case)', async () => {
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

  it('should load config (with sourceKey) from process.env object (camel case)', async () => {
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

  it('should load config (with sourceKey) from source (camel case)', async () => {
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

  it('should load config from source (upper case)', async () => {
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
    const resp = config();
    expect(resp).rejects.toHaveProperty('code', 'validation-error');
    expect(resp).rejects.toHaveProperty('name', 'ValidationError');
    expect(resp).rejects.toHaveProperty('message', 'Invalid configuration');
    expect(resp).rejects.toHaveProperty('errors', expect.arrayContaining([
      expect.objectContaining({
        message: 'config.foobar should have required property \'uri\'',
        code: 'validation-error',
        field: 'config.foobar'
      })
    ]));
  });

  it('should throw error on load config from source object (missing all fields)', async () => {
    const schemaPath = `test/mocks/json-schema-base.yaml`;
    const data = {};

    const config = async () => load({ schemaPath, data });
    const resp = config();
    expect(resp).rejects.toHaveProperty('code', 'validation-error');
    expect(resp).rejects.toHaveProperty('name', 'ValidationError');
    expect(resp).rejects.toHaveProperty('message', 'Invalid configuration');
    expect(resp).rejects.toHaveProperty('errors', expect.arrayContaining([
      expect.objectContaining({
        message: 'config.foobar should have required property \'username\'',
        code: 'validation-error',
        field: 'config.foobar'
      }),
      expect.objectContaining({
        message: 'config.foobar should have required property \'token\'',
        code: 'validation-error',
        field: 'config.foobar'
      }),
      expect.objectContaining({
        message: 'config.foobar should have required property \'uri\'',
        code: 'validation-error',
        field: 'config.foobar'
      }),
      expect.objectContaining({
        message:
          'config.foobar.store should have required property \'redis\'',
        code: 'validation-error',
        field: 'config.foobar.store'
      })
    ]));
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

describe('loadBySchema', () => {
  it('should load config from data by provided schema', async () => {
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

    const config = await loadBySchema({ schema: BASE_JSON_SCHEMA, data });

    expect(config).toMatchObject({
      database: expect.objectContaining({
        connectionString: data.databaseConnectionString,
        poolSize: data.databasePoolSize && parseInt(data.databasePoolSize, 10)
      }),
      foobar: expect.objectContaining({
        username: data.foobarUsername,
        token: data.foobarToken,
        uri: data.foobarUri,
        timeoutInMs: data.foobarTimeoutInMs && parseInt(data.foobarTimeoutInMs, 10),
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

  it('should throw error on load config from source object (missing required field)', async () => {
    const data = {
      customKey: '100000',
      databaseConnectionString: 'http://o.oo',
      databasePoolSize: '9',
      foobarStoreRedis: 'redis://192.1.1.1/1',
      foobarTimeoutInMs: '100',
      foobarToken: 'token',
      foobarUsername: 'user'
    };

    const config = async () => loadBySchema({ schema: BASE_JSON_SCHEMA, data });
    const resp = config();
    expect(resp).rejects.toHaveProperty('code', 'validation-error');
    expect(resp).rejects.toHaveProperty('name', 'ValidationError');
    expect(resp).rejects.toHaveProperty('message', 'Invalid configuration');
    expect(resp).rejects.toHaveProperty('errors', expect.arrayContaining([
      expect.objectContaining({
        message: 'config.foobar should have required property \'uri\'',
        code: 'validation-error',
        field: 'config.foobar'
      })
    ]));
  });
});

describe('format', () => {
  describe('snake case', () => {
    it('should load config from process.env object', async () => {
      const schemaPath = `test/mocks/json-schema-format-snake-case.yaml`;
      process.env = {
        ...process.env,
        custom_key: '100000',
        database_connection_string: 'http://o.oo',
        database_pool_size: '9',
        foobar_store_redis: 'redis://192.1.1.1/1',
        foobar_timeout_in_ms: '100',
        foobar_token: 'token',
        foobar_uri: 'https://www.foobar.com/api/v2',
        foobar_username: 'user',
        re_connecting_string: 'redis://192.1.1.1/2',
        re_connecting_string_2: 'redis://192.1.1.1/3'
      };

      const config = await loadFromEnvironment({ schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: process.env.database_connection_string,
          poolSize: process.env.database_pool_size && parseInt(process.env.database_pool_size, 10)
        }),
        foobar: expect.objectContaining({
          username: process.env.foobar_username,
          token: process.env.foobar_token,
          uri: process.env.foobar_uri,
          timeoutInMs: process.env.foobar_timeout_in_ms && parseInt(process.env.foobar_timeout_in_ms, 10),
          customKey: 100000,
          store: expect.objectContaining({
            redis: process.env.foobar_store_redis,
            redisExternal: process.env.re_connecting_string_2
          })
        }),
        redis: process.env.re_connecting_string
      });
    });

    it('should load config form source', async () => {
      const schemaPath = `test/mocks/json-schema-format-snake-case.yaml`;
      const data = {
        custom_key: '100000',
        database_connection_string: 'http://o.oo',
        database_pool_size: '9',
        foobar_token: 'token',
        foobar_uri: 'https://www.foobar.com/api/v2',
        foobar_username: 'user',
        foobar_store_redis: 'redis://192.1.1.1/1'
      };

      const config = await load({ data, schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: data.database_connection_string,
          poolSize: data.database_pool_size && parseInt(data.database_pool_size, 10)
        }),
        foobar: expect.objectContaining({
          username: data.foobar_username,
          token: data.foobar_token,
          uri: data.foobar_uri,
          customKey: 100000,
          store: expect.objectContaining({
            redis: data.foobar_store_redis
          })
        }),
        redis: undefined
      });
    });

    it('should throw error on source with missing one required field', async () => {
      const schemaPath = `test/mocks/json-schema-format-snake-case.yaml`;
      const data = {
        database_connection_string: 'http://o.oo',
        database_pool_size: '9',
        foobar_uri: 'https://www.foobar.com/api/v2',
        foobar_username: 'user',
        'FOOBAR-STORE-REDIS': 'redis://192.1.1.1/1'
      };

      const config = async () => load({ schemaPath, data });

      expect(config()).rejects.toThrowError(Error('Invalid configuration'));

      config().catch((err) => {
        expect(err).toHaveProperty('errors', expect.arrayContaining([
          expect.objectContaining({
            code: 'validation-error',
            field: 'config.foobar',
            data: expect.objectContaining({ missingProperty: 'token' })
          })
        ]));
      });
    });
  });

  describe('camel case', () => {
    it('should load config from process.env object', async () => {
      const schemaPath = `test/mocks/json-schema-format-camel-case.yaml`;
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
        reConnectingString_2: 'redis://192.1.1.1/3'
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
        redis: process.env.reConnectingString
      });
    });

    it('should load config form source', async () => {
      const schemaPath = `test/mocks/json-schema-format-camel-case.yaml`;
      const data = {
        customKey: '100000',
        databaseConnectionString: 'http://o.oo',
        databasePoolSize: '9',
        foobarToken: 'token',
        foobarUri: 'https://www.foobar.com/api/v2',
        foobarUsername: 'user',
        foobarStoreRedis: 'redis://192.1.1.1/1'
      };

      const config = await load({ data, schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: data.databaseConnectionString,
          poolSize: data.databasePoolSize && parseInt(data.databasePoolSize, 10)
        }),
        foobar: expect.objectContaining({
          username: data.foobarUsername,
          token: data.foobarToken,
          uri: data.foobarUri,
          store: expect.objectContaining({
            redis: data.foobarStoreRedis
          })
        }),
        redis: undefined
      });
    });
  });

  describe('kebab case', () => {
    it('should load config from process.env object', async () => {
      const schemaPath = `test/mocks/json-schema-format-kebab-case.yaml`;
      process.env = {
        ...process.env,
        'custom-key': '100000',
        'database-connection-string': 'http://o.oo',
        'database-pool-size': '9',
        'foobar-store-redis': 'redis://192.1.1.1/1',
        'foobar-timeout-in-ms': '100',
        'foobar-token': 'token',
        'foobar-uri': 'https://www.foobar.com/api/v2',
        'foobar-username': 'user',
        're-connecting-string': 'redis://192.1.1.1/2',
        're-connecting-string-2': 'redis://192.1.1.1/3'
      };

      const config = await loadFromEnvironment({ schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: process.env['database-connection-string'],
          poolSize: process.env['database-pool-size'] && parseInt(process.env['database-pool-size'] || '', 10)
        }),
        foobar: expect.objectContaining({
          username: process.env['foobar-username'],
          token: process.env['foobar-token'],
          uri: process.env['foobar-uri'],
          timeoutInMs: process.env['foobar-timeout-in-ms'] && parseInt(process.env['foobar-timeout-in-ms'] || '', 10),
          customKey: 100000,
          store: expect.objectContaining({
            redis: process.env['foobar-store-redis'],
            redisExternal: process.env['re-connecting-string-2']
          })
        }),
        redis: process.env['re-connecting-string']
      });
    });

    it('should load config form source', async () => {
      const schemaPath = `test/mocks/json-schema-format-kebab-case.yaml`;
      const data = {
        'custom-key': '100000',
        'database-connection-string': 'http://o.oo',
        'database-pool-size': '9',
        'foobar-token': 'token',
        'foobar-uri': 'https://www.foobar.com/api/v2',
        'foobar-username': 'user',
        'foobar-store-redis': 'redis://192.1.1.1/1'
      };

      const config = await load({ data, schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: data['database-connection-string'],
          poolSize: data['database-pool-size'] && parseInt(data['database-pool-size'], 10)
        }),
        foobar: expect.objectContaining({
          username: data['foobar-username'],
          token: data['foobar-token'],
          uri: data['foobar-uri'],
          store: expect.objectContaining({
            redis: data['foobar-store-redis']
          })
        }),
        redis: undefined
      });
    });
  });

  describe('auto', () => {
    it('should load config from process.env object with mixed cases', async () => {
      const schemaPath = `test/mocks/json-schema-base.yaml`;
      process.env = {
        ...process.env,
        'custom-key': '100000',
        databaseConnectionString: 'http://o.oo',
        DatabasePoolSize: '9',
        'foobar/store/redis': 'redis://192.1.1.1/1',
        foobar_timeout_in_ms: '100',
        foobarToken: 'token',
        foobarUri: 'https://www.foobar.com/api/v2',
        foobarUsername: 'user',
        RE_CONNECTING_STRING: 'redis://192.1.1.1/2',
        reConnectingString_2: 'redis://192.1.1.1/3'
      };

      const config = await loadFromEnvironment({ schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: process.env.databaseConnectionString,
          poolSize: process.env.DatabasePoolSize && parseInt(process.env.DatabasePoolSize, 10)
        }),
        foobar: expect.objectContaining({
          username: process.env.foobarUsername,
          token: process.env.foobarToken,
          uri: process.env.foobarUri,
          timeoutInMs: process.env.foobar_timeout_in_ms && parseInt(process.env.foobar_timeout_in_ms, 10),
          customKey: parseInt(process.env['custom-key'] || '', 10),
          store: expect.objectContaining({
            redis: process.env['foobar/store/redis'],
            redisExternal: process.env.reConnectingString_2
          })
        }),
        redis: process.env.RE_CONNECTING_STRING
      });
    });

    it('should load config form source with mixed cases', async () => {
      const schemaPath = `test/mocks/json-schema-base.yaml`;
      const data = {
        customKey: '100000',
        database_connection_string: 'http://o.oo',
        'database/pool/size': '9',
        FOOBAR_TOKEN: 'token',
        FoobarUri: 'https://www.foobar.com/api/v2',
        'foobar-username': 'user',
        foobarStoreRedis: 'redis://192.1.1.1/1'
      };

      const config = await load({ data, schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: data.database_connection_string,
          poolSize: data['database/pool/size'] && parseInt(data['database/pool/size'], 10)
        }),
        foobar: expect.objectContaining({
          username: data['foobar-username'],
          token: data.FOOBAR_TOKEN,
          uri: data.FoobarUri,
          store: expect.objectContaining({
            redis: data.foobarStoreRedis
          })
        }),
        redis: undefined
      });
    });

    it('should throw error on source with one missing required field', async () => {
      const schemaPath = `test/mocks/json-schema-base.yaml`;
      const data = {
        custom_key: '100000',
        'database-connection-string': 'http://o.oo',
        DATABASE_POOL_SIZE: '9',
        'foobar/token': 'token',
        foobar_uri: 'https://www.foobar.com/api/v2',
        foobar_username: 'user'
      };

      const config = async () => load({ schemaPath, data });

      expect(config()).rejects.toThrowError(Error('Invalid configuration'));
      config().catch((err) => {
        expect(err).toHaveProperty('errors', expect.arrayContaining([
          expect.objectContaining({
            code: 'validation-error',
            field: 'config.foobar.store'
          })
        ]));
      });
    });
  });

  describe('unknown', () => {
    it('should load config from process.env object with mixed cases', async () => {
      const schemaPath = `test/mocks/json-schema-format-unknown.yaml`;
      process.env = {
        ...process.env,
        'custom-key': '100000',
        databaseConnectionString: 'http://o.oo',
        DatabasePoolSize: '9',
        'foobar/store/redis': 'redis://192.1.1.1/1',
        foobar_timeout_in_ms: '100',
        foobarToken: 'token',
        foobarUri: 'https://www.foobar.com/api/v2',
        foobarUsername: 'user',
        RE_CONNECTING_STRING: 'redis://192.1.1.1/2',
        reConnectingString_2: 'redis://192.1.1.1/3'
      };

      const config = await loadFromEnvironment({ schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: process.env.databaseConnectionString,
          poolSize: process.env.DatabasePoolSize && parseInt(process.env.DatabasePoolSize, 10)
        }),
        foobar: expect.objectContaining({
          username: process.env.foobarUsername,
          token: process.env.foobarToken,
          uri: process.env.foobarUri,
          timeoutInMs: process.env.foobar_timeout_in_ms && parseInt(process.env.foobar_timeout_in_ms, 10),
          customKey: parseInt(process.env['custom-key'] || '', 10),
          store: expect.objectContaining({
            redis: process.env['foobar/store/redis'],
            redisExternal: process.env.reConnectingString_2
          })
        }),
        redis: process.env.RE_CONNECTING_STRING
      });
    });

    it('should load config form source with mixed cases', async () => {
      const schemaPath = `test/mocks/json-schema-format-unknown.yaml`;
      const data = {
        customKey: '100000',
        database_connection_string: 'http://o.oo',
        databasePoolSize: '9',
        foobar_token: 'token',
        FoobarUri: 'https://www.foobar.com/api/v2',
        foobarUsername: 'user',
        foobarStoreRedis: 'redis://192.1.1.1/1'
      };

      const config = await load({ data, schemaPath });

      expect(config).toMatchObject({
        database: expect.objectContaining({
          connectionString: data.database_connection_string,
          poolSize: data.databasePoolSize && parseInt(data.databasePoolSize, 10)
        }),
        foobar: expect.objectContaining({
          username: data.foobarUsername,
          token: data.foobar_token,
          uri: data.FoobarUri,
          store: expect.objectContaining({
            redis: data.foobarStoreRedis
          })
        }),
        redis: undefined
      });
    });

    it('should throw error on source with one missing required field', async () => {
      const schemaPath = `test/mocks/json-schema-format-unknown.yaml`;
      const data = {
        custom_key: '100000',
        'database-connection-string': 'http://o.oo',
        DATABASE_POOL_SIZE: '9',
        'foobar/token': 'token',
        foobar_uri: 'https://www.foobar.com/api/v2',
        foobar_username: 'user'
      };

      const config = async () => load({ schemaPath, data });

      expect(config()).rejects.toThrowError(Error('Invalid configuration'));
      config().catch((err) => {
        expect(err).toHaveProperty('errors', expect.arrayContaining([
          expect.objectContaining({
            code: 'validation-error',
            field: 'config.foobar.store'
          })
        ]));
      });
    });
  });
});
