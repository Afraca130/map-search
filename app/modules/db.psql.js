const Pool = require('pg').Pool;
const fs = require('fs');
const path = require('path');
const PoiEntity = require('../entities/PoiEntity');

// mybatis mapper
const mapper = require('mybatis-mapper');

let pool = null;
let isInitialized = false;

// Initialize database connection and mapper
function initialize() {
    if (isInitialized) return;

    // Initialize pool with CONFIG
    if (typeof CONFIG !== 'undefined') {
        pool = new Pool(CONFIG.db_server);
    } else {
        throw new Error('CONFIG is not defined. Make sure app.js has loaded first.');
    }

    // Initialize mapper files
    const ROOT = global.ROOT || __dirname + '/../..';
    const mapperPath = path.join(ROOT, 'app', 'mapper');

    if (fs.existsSync(mapperPath)) {
        const mapperList = fs.readdirSync(mapperPath);
        for (var file of mapperList) {
            mapper.createMapper([path.join(mapperPath, file)]);
        }
    }

    isInitialized = true;
}

// Get pool instance (lazy initialization)
function getPool() {
    if (!pool) {
        initialize();
    }
    return pool;
}

var format = { language: 'sql', indent: '  ' };

// SQL 수행 전 로그
let preSqlLog = (sql) => {
    console.log('------------------------	--------------------------------');
    console.log(`✅  execute SQL :\n${sql}`);
};

// SQL 수행 후 로그
let postSqlLog = (count) => {
    if (count !== undefined) {
        console.log(`✅  result of SQL : ${count}건`);
    }
    console.log('--------------------------------------------------------');
};

/** Execute SELECT query returning multiple rows as array */
exports.select = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            if (typeof onSuccess === 'function') {
                const funcCmmn = global.funcCmmn || require('./func-common');
                // SELECT SQL 여러 개일 경우 조회 결과가 배열로 RETURN 됨
                if (Array.isArray(result)) {
                    for (this_result of result) {
                        postSqlLog(this_result.rowCount);
                        for (let data of this_result.rows) {
                            data = funcCmmn.snakeToCamel(data);
                        }
                    }
                    onSuccess(result);
                } else {
                    postSqlLog(result.rowCount);
                    onSuccess(result.rowCount ? funcCmmn.snakeToCamel(result.rows) : []);
                }
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute SELECT query returning single row as object */
exports.selectOne = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                const funcCmmn = global.funcCmmn || require('./func-common');
                onSuccess(result.rowCount ? funcCmmn.snakeToCamel(result.rows[0]) : null);
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute INSERT query returning count of inserted rows */
exports.insert = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                onSuccess(result.rowCount);
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute INSERT query returning inserted rows data */
exports.insertReturn = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                const funcCmmn = global.funcCmmn || require('./func-common');
                onSuccess(funcCmmn.snakeToCamel(result.rows));
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute UPDATE query returning count of updated rows */
exports.update = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                onSuccess(result.rowCount);
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute UPDATE query returning updated rows data */
exports.updateReturn = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                const funcCmmn = global.funcCmmn || require('./func-common');
                onSuccess(funcCmmn.snakeToCamel(result.rows));
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

/** Execute DELETE query returning count of deleted rows */
exports.delete = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    getPool()
        .query(sql)
        .then((result) => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                onSuccess(result.rowCount);
            } else {
                return;
            }
        })
        .catch((err) => {
            postSqlLog();

            if (typeof onError === 'function') {
                onError(err);
            } else {
                return;
            }
        });
};

exports.getConnection = () => {
    return getPool().connect();
};

exports.getStatement = (mapperName, queryId, param) => {
    const statement = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(statement);
    return statement;
};

/* Entity Sync - Synchronize database tables based on entity definitions */
exports.syncEntity = async (entity, onSuccess, onError) => {
    console.log('🔄 Starting entity sync for table:', entity.tableName);

    try {
        const client = await getPool().connect();
        console.log('✅ Database connection established');

        try {
            // Begin transaction
            await client.query('BEGIN');
            console.log('🔄 Transaction started');

            // Execute SQL statements in sequence
            const dropSQL = entity.getDropTableSQL();
            if (dropSQL) {
                console.log('🗑️  Dropping table if exists...');
                preSqlLog(dropSQL);
                await client.query(dropSQL);
            }

            const createTableSQL = entity.getCreateTableSQL();
            if (createTableSQL) {
                console.log('🏗️  Creating table...');
                preSqlLog(createTableSQL);
                await client.query(createTableSQL);
            }

            const createIndexesSQL = entity.getCreateIndexesSQL();
            if (createIndexesSQL) {
                console.log('📇 Creating indexes...');
                preSqlLog(createIndexesSQL);
                const indexStatements = createIndexesSQL
                    .split('\n')
                    .filter((sql) => sql.trim().length > 0);
                for (const indexSQL of indexStatements) {
                    await client.query(indexSQL);
                }
            }

            const insertSampleDataSQL = entity.getInsertSampleDataSQL();
            if (insertSampleDataSQL) {
                console.log('📋 Inserting sample data...');
                preSqlLog(insertSampleDataSQL);
                const result = await client.query(insertSampleDataSQL);
                postSqlLog(result.rowCount);
                console.log(`✅ Inserted ${result.rowCount} sample records`);
            }

            // Commit transaction
            await client.query('COMMIT');
            console.log('✅ Transaction committed successfully');

            if (typeof onSuccess === 'function') {
                onSuccess('Entity synchronized successfully');
            }
        } catch (err) {
            console.error('❌ Error during entity sync, rolling back:', err.message);
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Entity sync failed:', err.message);
        postSqlLog();

        if (typeof onError === 'function') {
            onError(err);
        } else {
            console.error('Entity sync error:', err);
        }
    }
};

/* Sync POI Entity - Convenience method for syncing POI table */
exports.syncPoiEntity = async (onSuccess, onError) => {
    const poiEntity = new PoiEntity();
    await exports.syncEntity(poiEntity, onSuccess, onError);
};
