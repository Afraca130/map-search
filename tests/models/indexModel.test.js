const indexModel = require('../../app/models/indexModel');

// Mock the psql module
jest.mock('../../app/modules/db.psql.js', () => ({
    syncPoiEntity: jest.fn(),
    delete: jest.fn(),
    insert: jest.fn(),
    select: jest.fn()
}));

const psql = require('../../app/modules/db.psql.js');

describe('indexModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('newModel', () => {
        test('should create new model instance', () => {
            const mockExtend = jest.fn().mockReturnValue({ id: 1, name: 'test' });
            
            // Mock baseModel
            require('../../app/models/baseModel').extend = mockExtend;
            
            const options = { id: 1, name: 'test' };
            const result = indexModel.newModel(options);
            
            expect(mockExtend).toHaveBeenCalledWith(
                { id: null, name: null }, 
                options
            );
            expect(result).toEqual({ id: 1, name: 'test' });
        });

        test('should create model with default values when no options provided', () => {
            const mockExtend = jest.fn().mockReturnValue({ id: null, name: null });
            
            require('../../app/models/baseModel').extend = mockExtend;
            
            const result = indexModel.newModel();
            
            expect(mockExtend).toHaveBeenCalledWith(
                { id: null, name: null }, 
                undefined
            );
        });
    });

    describe('createTable', () => {
        test('should create table successfully', async () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();
            
            psql.syncPoiEntity.mockImplementation((successCallback) => {
                successCallback('Table created');
            });

            await indexModel.createTable(onSuccess, onError);

            expect(psql.syncPoiEntity).toHaveBeenCalledWith(onSuccess, onError);
            expect(onSuccess).toHaveBeenCalledWith('Table created');
            expect(onError).not.toHaveBeenCalled();
        });

        test('should handle table creation error', async () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Table creation failed');
            
            psql.syncPoiEntity.mockImplementation((successCallback, errorCallback) => {
                errorCallback(error);
            });

            await indexModel.createTable(onSuccess, onError);

            expect(psql.syncPoiEntity).toHaveBeenCalledWith(onSuccess, onError);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(error);
        });

        test('should handle exception during table creation', async () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Exception occurred');
            
            psql.syncPoiEntity.mockImplementation(() => {
                throw error;
            });

            await indexModel.createTable(onSuccess, onError);

            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
        });
    });

    describe('updatePoiData', () => {
        test('should update POI data successfully for small batch', () => {
            const poiData = [
                { title: 'POI 1', latitude: 37.5665, longitude: 126.9780 },
                { title: 'POI 2', latitude: 35.1596, longitude: 129.0626 }
            ];
            const onSuccess = jest.fn();
            const onError = jest.fn();

            // Mock delete operation
            psql.delete.mockImplementation((table, query, params, successCallback) => {
                successCallback('Deleted all');
            });

            // Mock insert operation
            psql.insert.mockImplementation((table, query, params, successCallback) => {
                successCallback('Inserted');
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            expect(psql.delete).toHaveBeenCalledWith('poi', 'deleteAllPoi', {}, expect.any(Function), onError);
            expect(psql.insert).toHaveBeenCalledWith('poi', 'insertPoi', { list: poiData }, expect.any(Function), onError);
            expect(onSuccess).toHaveBeenCalledWith(2);
            expect(onError).not.toHaveBeenCalled();
        });

        test('should process large batch in chunks', () => {
            // Create data with more than 1000 items
            const poiData = Array.from({ length: 2500 }, (_, i) => ({
                title: `POI ${i + 1}`,
                latitude: 37.5665 + (i * 0.001),
                longitude: 126.9780 + (i * 0.001)
            }));
            
            const onSuccess = jest.fn();
            const onError = jest.fn();

            // Mock delete operation
            psql.delete.mockImplementation((table, query, params, successCallback) => {
                successCallback('Deleted all');
            });

            // Mock insert operation - simulate multiple batch inserts
            let insertCallCount = 0;
            psql.insert.mockImplementation((table, query, params, successCallback) => {
                insertCallCount++;
                successCallback('Inserted batch');
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            expect(psql.delete).toHaveBeenCalledWith('poi', 'deleteAllPoi', {}, expect.any(Function), onError);
            expect(psql.insert).toHaveBeenCalledTimes(3); // 2500 items / 1000 batch size = 3 batches
            expect(onSuccess).toHaveBeenCalledWith(2500);
        });

        test('should handle empty POI data', () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();

            indexModel.updatePoiData([], onSuccess, onError);

            expect(onError).toHaveBeenCalledWith(new Error('POI 데이터가 비어있습니다.'));
            expect(onSuccess).not.toHaveBeenCalled();
            expect(psql.delete).not.toHaveBeenCalled();
        });

        test('should handle null POI data', () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();

            indexModel.updatePoiData(null, onSuccess, onError);

            expect(onError).toHaveBeenCalledWith(new Error('POI 데이터가 비어있습니다.'));
            expect(onSuccess).not.toHaveBeenCalled();
        });

        test('should handle delete operation error', () => {
            const poiData = [
                { title: 'POI 1', latitude: 37.5665, longitude: 126.9780 }
            ];
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Delete failed');

            psql.delete.mockImplementation((table, query, params, successCallback, errorCallback) => {
                errorCallback(error);
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            expect(psql.delete).toHaveBeenCalledWith('poi', 'deleteAllPoi', {}, expect.any(Function), onError);
            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(psql.insert).not.toHaveBeenCalled();
        });

        test('should handle insert operation error', () => {
            const poiData = [
                { title: 'POI 1', latitude: 37.5665, longitude: 126.9780 }
            ];
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Insert failed');

            // Mock successful delete
            psql.delete.mockImplementation((table, query, params, successCallback) => {
                successCallback('Deleted all');
            });

            // Mock failed insert
            psql.insert.mockImplementation((table, query, params, successCallback, errorCallback) => {
                errorCallback(error);
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
        });
    });

    describe('getAllPoi', () => {
        test('should get all POI data successfully', () => {
            const mockData = [
                { id: 1, title: 'POI 1', latitude: 37.5665, longitude: 126.9780 },
                { id: 2, title: 'POI 2', latitude: 35.1596, longitude: 129.0626 }
            ];
            const onSuccess = jest.fn();
            const onError = jest.fn();

            psql.select.mockImplementation((table, query, params, successCallback) => {
                successCallback(mockData);
            });

            indexModel.getAllPoi(onSuccess, onError);

            expect(psql.select).toHaveBeenCalledWith('poi', 'getAllPoi', {}, onSuccess, onError);
            expect(onSuccess).toHaveBeenCalledWith(mockData);
            expect(onError).not.toHaveBeenCalled();
        });

        test('should handle get all POI error', () => {
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Select failed');

            psql.select.mockImplementation((table, query, params, successCallback, errorCallback) => {
                errorCallback(error);
            });

            indexModel.getAllPoi(onSuccess, onError);

            expect(psql.select).toHaveBeenCalledWith('poi', 'getAllPoi', {}, onSuccess, onError);
            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
        });
    });

    describe('searchPoiByName', () => {
        test('should search POI by name successfully', () => {
            const mockData = [
                { id: 1, title: '경복궁', latitude: 37.5788, longitude: 126.9769 }
            ];
            const searchText = '경복궁';
            const onSuccess = jest.fn();
            const onError = jest.fn();

            psql.select.mockImplementation((table, query, params, successCallback) => {
                successCallback(mockData);
            });

            indexModel.searchPoiByName(searchText, onSuccess, onError);

            expect(psql.select).toHaveBeenCalledWith('poi', 'searchPoiByName', { searchText }, onSuccess, onError);
            expect(onSuccess).toHaveBeenCalledWith(mockData);
            expect(onError).not.toHaveBeenCalled();
        });

        test('should handle search POI error', () => {
            const searchText = '테스트';
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const error = new Error('Search failed');

            psql.select.mockImplementation((table, query, params, successCallback, errorCallback) => {
                errorCallback(error);
            });

            indexModel.searchPoiByName(searchText, onSuccess, onError);

            expect(psql.select).toHaveBeenCalledWith('poi', 'searchPoiByName', { searchText }, onSuccess, onError);
            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
        });

        test('should handle empty search results', () => {
            const mockData = [];
            const searchText = '존재하지않는검색어';
            const onSuccess = jest.fn();
            const onError = jest.fn();

            psql.select.mockImplementation((table, query, params, successCallback) => {
                successCallback(mockData);
            });

            indexModel.searchPoiByName(searchText, onSuccess, onError);

            expect(onSuccess).toHaveBeenCalledWith(mockData);
            expect(onError).not.toHaveBeenCalled();
        });

        test('should handle batch processing with exact batch size', () => {
            // Create data with exactly 1000 items to test batch boundary
            const poiData = Array.from({ length: 1000 }, (_, i) => ({
                title: `POI ${i + 1}`,
                latitude: 37.5665 + (i * 0.001),
                longitude: 126.9780 + (i * 0.001)
            }));
            
            const onSuccess = jest.fn();
            const onError = jest.fn();

            // Mock delete operation
            psql.delete.mockImplementation((table, query, params, successCallback) => {
                successCallback('Deleted all');
            });

            // Mock insert operation
            psql.insert.mockImplementation((table, query, params, successCallback) => {
                successCallback('Inserted batch');
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            expect(psql.insert).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith(1000);
        });

        test('should handle empty batch condition in recursive processBatch', () => {
            // Small dataset to trigger multiple batch calls
            const poiData = Array.from({ length: 1500 }, (_, i) => ({
                title: `POI ${i + 1}`,
                latitude: 37.5665 + (i * 0.001),
                longitude: 126.9780 + (i * 0.001)
            }));
            
            const onSuccess = jest.fn();
            const onError = jest.fn();

            // Mock delete operation
            psql.delete.mockImplementation((table, query, params, successCallback) => {
                successCallback('Deleted all');
            });

            // Mock insert operation - simulate successful batches that eventually reach empty batch
            let callCount = 0;
            psql.insert.mockImplementation((table, query, params, successCallback) => {
                callCount++;
                
                // For the first batch (1000 items), call success but trigger recursive call
                // For the second batch (500 items), call success and trigger the final empty batch check
                successCallback('Inserted batch');
            });

            indexModel.updatePoiData(poiData, onSuccess, onError);

            // Should process 2 batches (1000 + 500) and then hit empty batch condition
            expect(psql.insert).toHaveBeenCalledTimes(2);
            expect(onSuccess).toHaveBeenCalledWith(1500);
        });
    });
});