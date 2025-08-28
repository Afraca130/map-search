const request = require('supertest');
const express = require('express');

// Mock all dependencies before importing the controller
const mockIndexModel = {
    updatePoiData: jest.fn(),
    getAllPoi: jest.fn(),
    searchPoiByName: jest.fn(),
};

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const mockFs = {
    unlinkSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
};

const mockXlsx = {
    readFile: jest.fn(),
    utils: {
        sheet_to_json: jest.fn(),
    },
};

jest.doMock('../../app/models/indexModel', () => mockIndexModel);
jest.doMock('fs', () => mockFs);
jest.doMock('xlsx', () => mockXlsx);

global.logger = mockLogger;

const indexController = require('../../app/controllers/indexController');

describe('indexController', () => {
    let app;
    let injectedFile;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        injectedFile = null;
        // Inject mock file before route handlers so multer sees it
        app.use((req, res, next) => {
            if (req.path === '/upload-excel' && injectedFile) {
                req.file = injectedFile;
            }
            next();
        });
        jest.clearAllMocks();
    });

    describe('uploadExcel', () => {
        beforeEach(() => {
            app.post('/upload-excel', indexController.uploadExcel);
        });

        test('should return error when no file uploaded', async () => {
            const response = await request(app).post('/upload-excel').expect(400);

            expect(response.body.statusCode).toBe(400);
            expect(response.body.statusMessage).toBe('파일이 업로드되지 않았습니다.');
            expect(response.body.errorCode).toBe(400);
            expect(response.body.errorMessage).toBe('파일이 업로드되지 않았습니다.');
        });

        test('should process Excel file successfully', async () => {
            const mockFile = {
                path: '/tmp/test.xlsx',
                originalname: 'test.xlsx',
            };
            injectedFile = mockFile;

            const mockWorkbook = {
                SheetNames: ['Sheet1'],
                Sheets: { Sheet1: {} },
            };

            const mockJsonData = [
                { title: 'POI 1', latitude: '37.5665', longitude: '126.9780' },
                { title: 'POI 2', latitude: '35.1596', longitude: '129.0626' },
            ];

            mockXlsx.readFile.mockReturnValue(mockWorkbook);
            mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);
            mockFs.unlinkSync.mockImplementation(() => {});

            mockIndexModel.updatePoiData.mockImplementation((data, onSuccess) => {
                onSuccess(2);
            });

            const response = await request(app).post('/upload-excel').expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.statusMessage).toContain(
                'POI 데이터가 성공적으로 업데이트되었습니다',
            );
            expect(response.body.resultData.count).toBe(2);
            expect(response.body.resultData.filename).toBe('test.xlsx');
            expect(mockFs.unlinkSync).toHaveBeenCalledWith(mockFile.path);
        });

        test('should handle validation errors and process valid data', async () => {
            const mockFile = {
                path: '/tmp/test.xlsx',
                originalname: 'test.xlsx',
            };
            injectedFile = mockFile;

            const mockWorkbook = {
                SheetNames: ['Sheet1'],
                Sheets: { Sheet1: {} },
            };

            const mockJsonData = [
                { title: 'Valid POI', latitude: '37.5665', longitude: '126.9780' },
                { title: '', latitude: '35.1596', longitude: '129.0626' },
                { title: 'Invalid coords', latitude: '0', longitude: '0' },
            ];

            mockXlsx.readFile.mockReturnValue(mockWorkbook);
            mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);
            mockFs.unlinkSync.mockImplementation(() => {});

            mockIndexModel.updatePoiData.mockImplementation((data, onSuccess) => {
                onSuccess(1);
            });

            const response = await request(app).post('/upload-excel').expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData.count).toBe(1);
            expect(response.body.resultData.errors).toBeDefined();
            expect(response.body.resultData.errors.length).toBeGreaterThan(0);
            expect(response.body.statusMessage).toContain('개 행에서 오류 발생');
        });

        test('should return validation error when no valid POIs', async () => {
            const mockFile = {
                path: '/tmp/test.xlsx',
                originalname: 'test.xlsx',
            };
            injectedFile = mockFile;

            const mockWorkbook = {
                SheetNames: ['Sheet1'],
                Sheets: { Sheet1: {} },
            };

            const mockJsonData = [{ title: '', latitude: '0', longitude: '0' }];

            mockXlsx.readFile.mockReturnValue(mockWorkbook);
            mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);
            mockFs.unlinkSync.mockImplementation(() => {});

            const response = await request(app).post('/upload-excel').expect(400);

            expect(response.body.statusCode).toBe(400);
            expect(response.body.statusMessage).toBe('데이터 검증 중 오류가 발생했습니다.');
            expect(response.body.resultData.errors).toBeDefined();
        });

        test('should handle database update error', async () => {
            const mockFile = {
                path: '/tmp/test.xlsx',
                originalname: 'test.xlsx',
            };
            injectedFile = mockFile;

            const mockWorkbook = {
                SheetNames: ['Sheet1'],
                Sheets: { Sheet1: {} },
            };

            const mockJsonData = [
                { title: 'Valid POI', latitude: '37.5665', longitude: '126.9780' },
            ];

            mockXlsx.readFile.mockReturnValue(mockWorkbook);
            mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);
            mockFs.unlinkSync.mockImplementation(() => {});

            mockIndexModel.updatePoiData.mockImplementation((data, onSuccess, onError) => {
                onError(new Error('Database error'));
            });

            const response = await request(app).post('/upload-excel').expect(500);

            expect(response.body.statusCode).toBe(500);
            expect(response.body.statusMessage).toBe('POI 데이터 업데이트 중 오류가 발생했습니다.');
        });

        test('should handle Excel processing error', async () => {
            const mockFile = {
                path: '/tmp/test.xlsx',
                originalname: 'test.xlsx',
            };
            injectedFile = mockFile;

            mockXlsx.readFile.mockImplementation(() => {
                throw new Error('Excel parsing error');
            });

            mockFs.unlinkSync.mockImplementation(() => {});
            mockFs.existsSync.mockReturnValue(true);

            const response = await request(app).post('/upload-excel').expect(500);

            expect(response.body.statusCode).toBe(500);
            expect(response.body.statusMessage).toBe('엑셀 파일 처리 중 오류가 발생했습니다.');
            expect(mockFs.unlinkSync).toHaveBeenCalledWith(mockFile.path);
        });
    });

    describe('getAllPoi', () => {
        beforeEach(() => {
            app.get('/poi', indexController.getAllPoi);
        });

        test('should return all POI data successfully', async () => {
            const mockData = [
                { id: 1, title: 'POI 1', latitude: 37.5665, longitude: 126.978 },
                { id: 2, title: 'POI 2', latitude: 35.1596, longitude: 129.0626 },
            ];

            mockIndexModel.getAllPoi.mockImplementation((onSuccess) => {
                onSuccess(mockData);
            });

            const response = await request(app).get('/poi').expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual(mockData);
            expect(response.body.statusMessage).toBe('2개의 POI 데이터를 조회했습니다.');
            expect(response.body.resultCnt).toBe(2);
        });

        test('should handle missing table error', async () => {
            const error = new Error('Table does not exist');
            error.code = '42P01';

            mockIndexModel.getAllPoi.mockImplementation((onSuccess, onError) => {
                onError(error);
            });

            const response = await request(app).get('/poi').expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual([]);
            expect(response.body.statusMessage).toBe(
                'POI 테이블이 존재하지 않습니다. 엑셀 파일을 업로드해주세요.',
            );
            expect(response.body.resultCnt).toBe(0);
        });

        test('should handle general database error', async () => {
            const error = new Error('Database connection failed');

            mockIndexModel.getAllPoi.mockImplementation((onSuccess, onError) => {
                onError(error);
            });

            const response = await request(app).get('/poi').expect(500);

            expect(response.body.statusCode).toBe(500);
            expect(response.body.statusMessage).toBe('POI 데이터를 조회할 수 없습니다.');
        });
    });

    describe('searchPoi', () => {
        beforeEach(() => {
            app.get('/search', indexController.searchPoi);
        });

        test('should return empty result for empty search text', async () => {
            const response = await request(app)
                .get('/search')
                .query({ searchText: '' })
                .expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual([]);
            expect(response.body.statusMessage).toBe('검색어를 입력해주세요.');
        });

        test('should return empty result for whitespace search text', async () => {
            const response = await request(app)
                .get('/search')
                .query({ searchText: '   ' })
                .expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual([]);
            expect(response.body.statusMessage).toBe('검색어를 입력해주세요.');
        });

        test('should return search results successfully', async () => {
            const mockData = [{ id: 1, title: '경복궁', latitude: 37.5788, longitude: 126.9769 }];

            mockIndexModel.searchPoiByName.mockImplementation((searchText, onSuccess) => {
                onSuccess(mockData);
            });

            const response = await request(app)
                .get('/search')
                .query({ searchText: '경복궁' })
                .expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual(mockData);
            expect(response.body.statusMessage).toBe('"경복궁" 검색 결과: 1개');
            expect(mockIndexModel.searchPoiByName).toHaveBeenCalledWith(
                '경복궁',
                expect.any(Function),
                expect.any(Function),
            );
        });

        test('should handle missing table error in search', async () => {
            const error = new Error('Table does not exist');
            error.code = '42P01';

            mockIndexModel.searchPoiByName.mockImplementation((searchText, onSuccess, onError) => {
                onError(error);
            });

            const response = await request(app)
                .get('/search')
                .query({ searchText: '테스트' })
                .expect(200);

            expect(response.body.statusCode).toBe(200);
            expect(response.body.resultData).toEqual([]);
            expect(response.body.statusMessage).toBe(
                'POI 테이블이 존재하지 않습니다. 엑셀 파일을 업로드해주세요.',
            );
        });

        test('should handle general search error', async () => {
            const error = new Error('Search failed');

            mockIndexModel.searchPoiByName.mockImplementation((searchText, onSuccess, onError) => {
                onError(error);
            });

            const response = await request(app)
                .get('/search')
                .query({ searchText: '테스트' })
                .expect(500);

            expect(response.body.statusCode).toBe(500);
            expect(response.body.statusMessage).toBe('POI 검색 중 오류가 발생했습니다.');
        });

        test('should trim search text', async () => {
            const mockData = [];

            mockIndexModel.searchPoiByName.mockImplementation((searchText, onSuccess) => {
                onSuccess(mockData);
            });

            await request(app).get('/search').query({ searchText: '  테스트  ' }).expect(200);

            expect(mockIndexModel.searchPoiByName).toHaveBeenCalledWith(
                '테스트',
                expect.any(Function),
                expect.any(Function),
            );
        });
    });
});
