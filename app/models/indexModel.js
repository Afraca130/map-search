let baseModel = require('./baseModel');
const psql = require('../modules/db.psql');

const INDEX = {
    id: null,
    name: null,
};

exports.newModel = (opt) => {
    return baseModel.extend(INDEX, opt);
};

exports.createTable = async (onSuccess, onError) => {
    try {
        await psql.syncPoiEntity(onSuccess, onError);
    } catch (error) {
        if (typeof onError === 'function') {
            onError(error);
        }
    }
};

exports.updatePoiData = (poiData, onSuccess, onError) => {
    if (!poiData || poiData.length === 0) {
        return onError(new Error('POI 데이터가 비어있습니다.'));
    }

    psql.delete(
        'poi',
        'deleteAllPoi',
        {},
        (deleteResult) => {
            const batchSize = 1000;
            let processedCount = 0;
            let totalCount = poiData.length;

            const processBatch = (startIndex) => {
                const endIndex = Math.min(startIndex + batchSize, totalCount);
                const batch = poiData.slice(startIndex, endIndex);

                if (batch.length === 0) {
                    return onSuccess(totalCount);
                }

                psql.insert(
                    'poi',
                    'insertPoi',
                    { list: batch },
                    (insertResult) => {
                        processedCount += batch.length;
                        if (processedCount >= totalCount) {
                            onSuccess(totalCount);
                        } else {
                            processBatch(endIndex);
                        }
                    },
                    onError,
                );
            };

            processBatch(0);
        },
        onError,
    );
};

exports.getAllPoi = (onSuccess, onError) => {
    psql.select('poi', 'getAllPoi', {}, onSuccess, onError);
};

exports.searchPoiByName = (searchText, onSuccess, onError) => {
    psql.select('poi', 'searchPoiByName', { searchText: searchText }, onSuccess, onError);
};
