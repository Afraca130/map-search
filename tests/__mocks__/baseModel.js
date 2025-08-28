module.exports = {
    extend: jest.fn((base, options) => {
        return { ...base, ...options };
    })
};