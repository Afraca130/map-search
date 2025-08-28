const PoiEntity = require('../../app/entities/PoiEntity');

describe('PoiEntity', () => {
    let poiEntity;

    beforeEach(() => {
        poiEntity = new PoiEntity();
    });

    describe('constructor', () => {
        test('should initialize with correct table name', () => {
            expect(poiEntity.tableName).toBe('poi');
        });

        test('should initialize with correct schema', () => {
            expect(poiEntity.schema).toEqual({
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
            });
        });

        test('should initialize with correct indexes', () => {
            expect(poiEntity.indexes).toEqual([
                {
                    name: 'idx_poi_title',
                    columns: ['title'],
                },
            ]);
        });

        test('should initialize with empty sample data', () => {
            expect(poiEntity.sampleData).toEqual([]);
        });
    });

    describe('getCreateTableSQL', () => {
        test('should generate correct CREATE TABLE SQL', () => {
            const sql = poiEntity.getCreateTableSQL();

            expect(sql).toContain('CREATE TABLE IF NOT EXISTS poi');
            expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
            expect(sql).toContain('title VARCHAR(500) NOT NULL');
            expect(sql).toContain('latitude DECIMAL(15,10) NOT NULL');
            expect(sql).toContain('longitude DECIMAL(15,10) NOT NULL');
            expect(sql).toContain('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            expect(sql.endsWith(';')).toBe(true);
        });

        test('should format columns correctly with proper spacing', () => {
            const sql = poiEntity.getCreateTableSQL();

            // Check that columns are properly formatted with spaces
            expect(sql).toMatch(/\s{4}id\s+UUID/);
            expect(sql).toMatch(/\s{4}title\s+VARCHAR\(500\)/);
            expect(sql).toMatch(/\s{4}latitude\s+DECIMAL\(15,10\)/);
            expect(sql).toMatch(/\s{4}longitude\s+DECIMAL\(15,10\)/);
            expect(sql).toMatch(/\s{4}created_at\s+TIMESTAMP/);
        });
    });

    describe('getCreateIndexesSQL', () => {
        test('should generate correct CREATE INDEX SQL', () => {
            const sql = poiEntity.getCreateIndexesSQL();

            expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_poi_title ON poi(title)');
        });

        test('should join multiple indexes with newline', () => {
            const entity = new PoiEntity();
            entity.indexes = [
                { name: 'idx_a', columns: ['title'] },
                { name: 'idx_b', columns: ['latitude', 'longitude'] },
            ];
            const sql = entity.getCreateIndexesSQL();
            const lines = sql.split('\n');

            expect(lines).toHaveLength(2);
            expect(lines[0]).toContain('idx_a');
            expect(lines[1]).toContain('idx_b');
        });

        test('should handle single column index', () => {
            const testEntity = new PoiEntity();
            testEntity.indexes = [
                {
                    name: 'idx_test_single',
                    columns: ['title'],
                },
            ];

            const sql = testEntity.getCreateIndexesSQL();
            expect(sql).toBe('CREATE INDEX IF NOT EXISTS idx_test_single ON poi(title);');
        });

        test('should handle multiple column index', () => {
            const testEntity = new PoiEntity();
            testEntity.indexes = [
                {
                    name: 'idx_test_multi',
                    columns: ['latitude', 'longitude', 'title'],
                },
            ];

            const sql = testEntity.getCreateIndexesSQL();
            expect(sql).toBe(
                'CREATE INDEX IF NOT EXISTS idx_test_multi ON poi(latitude, longitude, title);',
            );
        });
    });

    describe('getInsertSampleDataSQL', () => {
        test('should return empty string for empty sample data', () => {
            const sql = poiEntity.getInsertSampleDataSQL();
            expect(sql).toBe('');
        });

        test('should generate INSERT SQL when sample data exists', () => {
            poiEntity.sampleData = [{ title: '테스트 POI', latitude: 37.5665, longitude: 126.978 }];

            const sql = poiEntity.getInsertSampleDataSQL();

            expect(sql).toContain('INSERT INTO poi (title, latitude, longitude) VALUES');
            expect(sql).toContain("('테스트 POI', 37.5665, 126.978");
            expect(sql).toContain(');');
        });

        test('should handle multiple sample data rows', () => {
            poiEntity.sampleData = [
                { title: 'POI 1', latitude: 37.5665, longitude: 126.978 },
                { title: 'POI 2', latitude: 35.1596, longitude: 129.0626 },
            ];

            const sql = poiEntity.getInsertSampleDataSQL();

            expect(sql).toContain("('POI 1', 37.5665, 126.978");
            expect(sql).toContain("('POI 2', 35.1596, 129.0626");
        });

        test('should properly quote string values', () => {
            poiEntity.sampleData = [{ title: "Test's POI", latitude: 37.5665, longitude: 126.978 }];

            const sql = poiEntity.getInsertSampleDataSQL();

            expect(sql).toContain("('Test's POI', 37.5665, 126.978");
        });

        test('should handle numeric values without quotes', () => {
            poiEntity.sampleData = [{ title: 'Test POI', latitude: 37.5665, longitude: 126.978 }];

            const sql = poiEntity.getInsertSampleDataSQL();

            // Numbers should not be quoted
            expect(sql).toContain('37.5665, 126.978');
            // String should be quoted
            expect(sql).toContain("'Test POI'");
        });
    });

    describe('getDropTableSQL', () => {
        test('should generate correct DROP TABLE SQL', () => {
            const sql = poiEntity.getDropTableSQL();
            expect(sql).toBe('DROP TABLE IF EXISTS poi;');
        });
    });

    describe('getSyncSQL', () => {
        test('should combine all SQL statements for empty sample data', () => {
            const sql = poiEntity.getSyncSQL();

            expect(sql).toContain('DROP TABLE IF EXISTS poi;');
            expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS poi');
            expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_poi_title');

            // Should not contain INSERT statement for empty sample data
            expect(sql).not.toContain('INSERT INTO');
        });

        test('should include INSERT statement when sample data exists', () => {
            poiEntity.sampleData = [{ title: 'Test POI', latitude: 37.5665, longitude: 126.978 }];

            const sql = poiEntity.getSyncSQL();

            expect(sql).toContain('DROP TABLE IF EXISTS poi;');
            expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
            expect(sql).toContain('CREATE TABLE IF NOT EXISTS poi');
            expect(sql).toContain('CREATE INDEX IF NOT EXISTS');
            expect(sql).toContain('INSERT INTO poi');
        });

        test('should separate SQL statements with double newlines', () => {
            poiEntity.sampleData = [{ title: 'Test POI', latitude: 37.5665, longitude: 126.978 }];

            const sql = poiEntity.getSyncSQL();
            const parts = sql.split('\n\n');

            // Should have parts: DROP, EXTENSION, CREATE TABLE, CREATE INDEXES, INSERT (some may be combined)
            expect(parts.length).toBeGreaterThanOrEqual(4);
        });

        test('should filter out empty SQL strings', () => {
            const sql = poiEntity.getSyncSQL();

            // Should not contain empty strings between newlines
            expect(sql).not.toMatch(/\n\n\n/);
        });
    });

    describe('edge cases', () => {
        test('should handle schema with different column types', () => {
            const testEntity = new PoiEntity();
            testEntity.schema = {
                id: { type: 'INTEGER', primaryKey: true },
                name: { type: 'TEXT', notNull: true },
                count: { type: 'INTEGER', default: '0' },
            };

            const sql = testEntity.getCreateTableSQL();

            expect(sql).toContain('id INTEGER PRIMARY KEY');
            expect(sql).toContain('name TEXT NOT NULL');
            expect(sql).toContain('count INTEGER DEFAULT 0');
        });

        test('should handle empty indexes array', () => {
            const testEntity = new PoiEntity();
            testEntity.indexes = [];

            const sql = testEntity.getCreateIndexesSQL();
            expect(sql).toBe('');
        });

        test('should handle sample data with mixed data types', () => {
            poiEntity.sampleData = [
                { title: 'Test', latitude: 37.5665, longitude: 126.978, active: true, count: 0 },
            ];

            const sql = poiEntity.getInsertSampleDataSQL();

            expect(sql).toContain("'Test'"); // string quoted
            expect(sql).toContain('37.5665'); // number not quoted
            expect(sql).toContain('true'); // boolean not quoted
            expect(sql).toContain('0'); // number not quoted
        });
    });
});
