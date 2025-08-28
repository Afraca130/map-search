const defaultMapper = 'index';
const indexModel = require('../models/indexModel');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');
// Use global logger defined in app.js
const logger = global.logger || console;
const { getReturnMessage } = require('../modules/func-common');

// ------------------------------
// Multer Setup
// ------------------------------
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const isExcel =
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel';
        isExcel ? cb(null, true) : cb(new Error('Only Excel files are allowed'), false);
    },
});

// ------------------------------
// Helpers: Parsing & Validation
// ------------------------------
function parseCoordinate(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function isValidCoordinate(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function toPoiFromExcelRow(row) {
    const title = (row.title || row.Title || row.TITLE || '').toString();
    const latitude = parseCoordinate(row.latitude || row.Latitude || row.LATITUDE || 0);
    const longitude = parseCoordinate(row.longitude || row.Longitude || row.LONGITUDE || 0);
    return { id: crypto.randomUUID(), title: title.trim(), latitude, longitude, created_at: null };
}

function validatePoiList(poiList) {
    const errors = [];
    const validPois = [];

    poiList.forEach((poi, index) => {
        const issues = [];
        if (!poi.title || !poi.title.trim()) issues.push('title is empty');
        if (poi.latitude === 0) issues.push('latitude is invalid');
        if (poi.longitude === 0) issues.push('longitude is invalid');
        if (!isValidCoordinate(poi.latitude, poi.longitude))
            issues.push('coordinates are out of range');
        issues.length > 0
            ? errors.push(`Row ${index + 1}: ${issues.join(', ')}`)
            : validPois.push(poi);
    });

    return { validPois, errors };
}

function buildOk(message, resultData, resultCnt) {
    return getReturnMessage({ code: 200, message, resultData, resultCnt });
}

function buildErr(code, message, resultData = {}, resultCnt = 0) {
    return getReturnMessage({ isErr: true, code, message, resultData, resultCnt });
}

// ------------------------------
// Controllers
// ------------------------------
exports.uploadExcel = [
    upload.single('excelFile'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json(buildErr(400, '파일이 업로드되지 않았습니다.'));
            }

            // Read workbook
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonRows = xlsx.utils.sheet_to_json(worksheet);

            // Transform & validate
            const pois = jsonRows.map(toPoiFromExcelRow);
            const { validPois, errors } = validatePoiList(pois);

            // Cleanup temp file ASAP
            fs.unlinkSync(req.file.path);

            // All rows invalid
            if (errors.length > 0) {
                logger.warn('엑셀 데이터 검증 오류', {
                    filename: req.file.originalname,
                    validCount: validPois.length,
                    errorCount: errors.length,
                    errors,
                });
                if (validPois.length === 0) {
                    return res
                        .status(400)
                        .json(buildErr(400, '데이터 검증 중 오류가 발생했습니다.', { errors }));
                }
            }

            const validPoiData = validPois.map((poi) => ({
                id: poi.id,
                title: poi.title,
                latitude: poi.latitude,
                longitude: poi.longitude,
                created_at: poi.created_at,
            }));

            indexModel.updatePoiData(
                validPoiData,
                (result) => {
                    logger.info('File upload successful', {
                        filename: req.file.originalname,
                        result,
                        success: true,
                    });

                    const baseMessage = `${result}개의 POI 데이터가 성공적으로 업데이트되었습니다.`;
                    const message =
                        errors.length > 0
                            ? `${baseMessage} (${errors.length}개 행에서 오류 발생)`
                            : baseMessage;

                    const response = buildOk(
                        message,
                        {
                            count: result,
                            filename: req.file.originalname,
                            errors: errors.length > 0 ? errors : undefined,
                        },
                        Number(result) || validPoiData.length,
                    );

                    res.json(response);
                },
                (error) => {
                    logger.error('POI 데이터 업데이트 오류', {
                        error: error.message,
                        filename: req.file?.originalname,
                        recordCount: validPoiData.length,
                    });
                    logger.error('File upload failed', {
                        filename: req.file?.originalname || 'unknown',
                        recordCount: 0,
                        success: false,
                    });

                    res.status(500).json(
                        buildErr(500, 'POI 데이터 업데이트 중 오류가 발생했습니다.'),
                    );
                },
            );
        } catch (error) {
            logger.error('엑셀 파일 처리 오류', {
                error: error.message,
                filename: req.file?.originalname,
                stack: error.stack,
            });

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json(buildErr(500, '엑셀 파일 처리 중 오류가 발생했습니다.'));
        }
    },
];

exports.getAllPoi = (req, res) => {
    indexModel.getAllPoi(
        (data) => {
            logger.info('POI 데이터 조회 성공', { resultCount: data.length });
            res.json(buildOk(`${data.length}개의 POI 데이터를 조회했습니다.`, data, data.length));
        },
        (error) => {
            logger.error('POI 데이터 조회 오류', { error: error.message, errorCode: error.code });

            if (error.code === '42P01') {
                return res.json(
                    buildOk('POI 테이블이 존재하지 않습니다. 엑셀 파일을 업로드해주세요.', [], 0),
                );
            }

            res.status(500).json(buildErr(500, 'POI 데이터를 조회할 수 없습니다.'));
        },
    );
};

exports.searchPoi = (req, res) => {
    const { searchText } = req.query;
    const startTime = Date.now();

    logger.info('POI 검색 요청', { searchText });

    if (!searchText || searchText.trim() === '') {
        logger.info('빈 검색어로 인해 빈 결과 반환');
        return res.json(buildOk('검색어를 입력해주세요.', [], 0));
    }

    const trimmedSearchText = searchText.trim();
    logger.info('검색어 처리 완료', { trimmedSearchText });

    indexModel.searchPoiByName(
        trimmedSearchText,
        (data) => {
            const duration = Date.now() - startTime;
            logger.info('POI search completed', {
                searchText: trimmedSearchText,
                resultCount: data.length,
                duration: `${duration}ms`,
            });
            logger.info('POI 검색 성공', {
                searchText: trimmedSearchText,
                resultCount: data.length,
                duration: `${duration}ms`,
                firstResult: data.length > 0 ? data[0] : null,
            });

            res.json(
                buildOk(`"${trimmedSearchText}" 검색 결과: ${data.length}개`, data, data.length),
            );
        },
        (error) => {
            const duration = Date.now() - startTime;
            logger.error('POI 검색 오류', {
                searchText: trimmedSearchText,
                error: error.message,
                errorCode: error.code,
                duration: `${duration}ms`,
            });

            if (error.code === '42P01') {
                logger.warn('POI 테이블이 존재하지 않음', { searchText: trimmedSearchText });
                return res.json(
                    buildOk('POI 테이블이 존재하지 않습니다. 엑셀 파일을 업로드해주세요.', [], 0),
                );
            }

            res.status(500).json(buildErr(500, 'POI 검색 중 오류가 발생했습니다.'));
        },
    );
};
