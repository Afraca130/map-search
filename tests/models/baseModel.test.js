const baseModel = require('../../app/models/baseModel');

describe('baseModel', () => {
    describe('extend', () => {
        test('should extend object with POST request data', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                params: {},
                body: { id: '1', name: 'test' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('1');
            expect(result.name).toBe('test');
        });

        test('should extend object with GET request data', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'GET',
                params: {},
                query: { id: '2', name: 'get-test' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('2');
            expect(result.name).toBe('get-test');
        });

        test('should handle route parameters', () => {
            const baseObject = { id: null, category: null };
            const target = {
                method: 'GET',
                params: { id: '123' },
                query: { category: 'books' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('123');
            expect(result.category).toBe('books');
        });

        test('should extend with JSON data when not POST/GET', () => {
            const baseObject = { id: null, name: null };
            const target = { id: '5', name: 'json-test' };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('5');
            expect(result.name).toBe('json-test');
        });

        test('should only extend properties that exist in source', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                params: {},
                body: { id: '1', name: 'test', extra: 'ignored' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('1');
            expect(result.name).toBe('test');
            expect(result.extra).toBeUndefined();
        });

        test('should handle XSS filtering', () => {
            const baseObject = { content: null };
            const target = {
                method: 'POST',
                params: {},
                body: { content: '<script>alert("xss")</script>safe content' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.content).toBe('&lt;script&gt;alert(\"xss\")&lt;/script&gt;safe content');
        });

        test('should handle errors gracefully', () => {
            const baseObject = { id: null };
            const target = null;
            
            expect(() => {
                baseModel.extend(baseObject, target);
            }).toThrow();
        });

        test('should handle undefined target gracefully', () => {
            const baseObject = { id: null, name: null };
            
            expect(() => {
                baseModel.extend(baseObject, undefined);
            }).toThrow();
        });

        test('should create deep copy of source', () => {
            const baseObject = { id: null, config: { enabled: false } };
            const target = {
                method: 'POST',
                params: {},
                body: {}
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result).not.toBe(baseObject);
            expect(result.config).not.toBe(baseObject.config);
        });

        test('should handle circular JSON gracefully', () => {
            const baseObject = { id: null };
            const target = {};
            target.self = target; // Create circular reference
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe(null);
        });

        test('should handle empty POST body', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                params: {},
                body: {}
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result).toEqual(baseObject);
        });

        test('should handle empty GET query', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'GET',
                params: {},
                query: {}
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result).toEqual(baseObject);
        });

        test('should handle missing params', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                body: { id: '1', name: 'test' }
            };
            
            expect(() => {
                baseModel.extend(baseObject, target);
            }).not.toThrow();
        });

        test('should handle missing body for POST', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                params: {}
            };
            
            expect(() => {
                baseModel.extend(baseObject, target);
            }).not.toThrow();
        });

        test('should handle missing query for GET', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'GET',
                params: {}
            };
            
            expect(() => {
                baseModel.extend(baseObject, target);
            }).not.toThrow();
        });

        test('should handle invalid JSON target', () => {
            const baseObject = { id: null };
            const target = { toString: () => { throw new Error('Invalid JSON'); } };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result).toEqual(baseObject);
        });

        test('should handle route params for POST', () => {
            const baseObject = { id: null, name: null };
            const target = {
                method: 'POST',
                params: { id: 'route-123' },
                body: { name: 'body-test' }
            };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('route-123');
            expect(result.name).toBe('body-test');
        });

        test('should cover JSON data branch', () => {
            const baseObject = { id: null, name: null };
            const target = { id: 'json-1', name: 'json-name' };
            
            const result = baseModel.extend(baseObject, target);
            
            expect(result.id).toBe('json-1');
            expect(result.name).toBe('json-name');
        });
    });

    describe('extend_null', () => {
        test('should create deep copy of source', () => {
            const source = { id: 1, name: 'test', config: { enabled: true } };
            
            const result = baseModel.extend_null(source);
            
            expect(result).toEqual(source);
            expect(result).not.toBe(source);
            expect(result.config).not.toBe(source.config);
        });

        test('should handle null source', () => {
            const result = baseModel.extend_null(null);
            
            expect(result).toEqual({});
        });

        test('should handle undefined source', () => {
            const result = baseModel.extend_null(undefined);
            
            expect(result).toEqual({});
        });

        test('should handle empty object', () => {
            const result = baseModel.extend_null({});
            
            expect(result).toEqual({});
        });
    });
});