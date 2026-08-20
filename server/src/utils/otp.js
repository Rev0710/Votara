const crypto = require("crypto");

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

module.exports = {
    generateOTP,
};