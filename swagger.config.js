const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Map POI API',
            version: '1.0.0',
            description: 'API for managing Point of Interest (POI) data with map visualization',
        },
        components: {
            schemas: {
                POI: {
                    type: 'object',
                    required: ['title', 'latitude', 'longitude'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Auto-generated ID',
                            example: 1,
                        },
                        title: {
                            type: 'string',
                            description: 'POI name/title',
                            example: '경복궁',
                        },
                        latitude: {
                            type: 'number',
                            format: 'double',
                            description: 'Latitude coordinate',
                            example: 37.5796,
                        },
                        longitude: {
                            type: 'number',
                            format: 'double',
                            description: 'Longitude coordinate',
                            example: 126.977,
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation timestamp',
                            example: '2023-01-01T00:00:00.000Z',
                        },
                    },
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Operation success status',
                        },
                        message: {
                            type: 'string',
                            description: 'Response message',
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/POI',
                            },
                            description: 'Response data array',
                        },
                        count: {
                            type: 'integer',
                            description: 'Number of records processed',
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                            example: 'Operation failed',
                        },
                        error: {
                            type: 'string',
                            description: 'Detailed error information',
                        },
                    },
                },
            },
        },
    },
    apis: ['./app/routes/*.js', './app/controllers/*.js'],
};

module.exports = swaggerJSDoc(options);
