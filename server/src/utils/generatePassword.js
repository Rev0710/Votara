const crypto = require("crypto");


// =====================================================
// GENERATE SECURE TEMPORARY PASSWORD
// =====================================================

const generateTemporaryPassword = (
    length = 10
) => {

    // =================================================
    // PASSWORD CHARACTER SETS
    // =================================================

    const uppercase =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const lowercase =
        "abcdefghijkmnopqrstuvwxyz";

    const numbers =
        "23456789";

    const special =
        "@#$%&*!";


    // =================================================
    // MAKE SURE PASSWORD CONTAINS ALL REQUIREMENTS
    // =================================================

    const requiredCharacters = [

        uppercase[
            crypto.randomInt(
                0,
                uppercase.length
            )
        ],

        lowercase[
            crypto.randomInt(
                0,
                lowercase.length
            )
        ],

        numbers[
            crypto.randomInt(
                0,
                numbers.length
            )
        ],

        special[
            crypto.randomInt(
                0,
                special.length
            )
        ],

    ];


    // =================================================
    // ALL AVAILABLE CHARACTERS
    // =================================================

    const allCharacters =
        uppercase +
        lowercase +
        numbers +
        special;


    // =================================================
    // GENERATE REMAINING CHARACTERS
    // =================================================

    while (
        requiredCharacters.length <
        length
    ) {

        requiredCharacters.push(
            allCharacters[
                crypto.randomInt(
                    0,
                    allCharacters.length
                )
            ]
        );

    }


    // =================================================
    // SECURELY SHUFFLE PASSWORD
    // =================================================

    for (
        let i =
            requiredCharacters.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            crypto.randomInt(
                0,
                i + 1
            );


        [
            requiredCharacters[i],
            requiredCharacters[randomIndex],
        ] = [
            requiredCharacters[randomIndex],
            requiredCharacters[i],
        ];

    }


    // =================================================
    // RETURN PASSWORD
    // =================================================

    return requiredCharacters.join("");
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    generateTemporaryPassword,
};