const generateOTP = () => {
    return require("crypto").randomInt(100000, 1000000).toString();
};

module.exports = {
    generateOTP,
};
