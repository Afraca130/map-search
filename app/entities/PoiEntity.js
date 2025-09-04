class PoiEntity {
    constructor() {
        this.tableName = 'poi';
        this.schema = {
            id: {
                type: 'UUID',
                primaryKey: true,
                default: 'gen_random_uuid()',
            },
            title: {
                type: 'VARCHAR(500)',
                notNull: true,
            },
            latitude: {
                type: 'DECIMAL(15,10)',
                notNull: true,
            },
            longitude: {
                type: 'DECIMAL(15,10)',
                notNull: true,
            },
            created_at: {
                type: 'TIMESTAMP',
                default: 'CURRENT_TIMESTAMP',
            },
        };
        this.indexes = [
            {
                name: 'idx_poi_title',
                columns: ['title'],
            },
        ];
        this.sampleData = [];
    }

    getCreateTableSQL() {
        let sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (\n`;

        const columns = [];
        for (const [columnName, columnDef] of Object.entries(this.schema)) {
            let columnSQL = `    ${columnName} ${columnDef.type}`;

            if (columnDef.primaryKey) {
                columnSQL += ' PRIMARY KEY';
            }
            if (columnDef.notNull) {
                columnSQL += ' NOT NULL';
            }
            if (columnDef.default) {
                columnSQL += ` DEFAULT ${columnDef.default}`;
            }

            columns.push(columnSQL);
        }

        sql += columns.join(',\n');
        sql += '\n);';

        return sql;
    }

    getCreateIndexesSQL() {
        return this.indexes
            .map(
                (index) =>
                    `CREATE INDEX IF NOT EXISTS ${index.name} ON ${
                        this.tableName
                    }(${index.columns.join(', ')});`,
            )
            .join('\n');
    }

    getInsertSampleDataSQL() {
        if (!this.sampleData || this.sampleData.length === 0) {
            return '';
        }

        const columns = Object.keys(this.sampleData[0]);
        let sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES\n`;

        const values = this.sampleData.map((row) => {
            const rowValues = columns.map((col) => {
                const value = row[col];
                return typeof value === 'string' ? `'${value}'` : value;
            });
            return `(${rowValues.join(', ')})`;
        });

        sql += values.join(',\n') + ';';
        return sql;
    }

    getDropTableSQL() {
        return `DROP TABLE IF EXISTS ${this.tableName};`;
    }

    getSyncSQL() {
        return [
            this.getDropTableSQL(),
            'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
            this.getCreateTableSQL(),
            this.getCreateIndexesSQL(),
            this.getInsertSampleDataSQL(),
        ]
            .filter((sql) => sql.length > 0)
            .join('\n\n');
    }
}

module.exports = PoiEntity;
