/**
 * Convert passport MRZ date (YYMMDD) to Unix timestamp
 */
export function mrzDateToTimestamp(mrzDate: string): number {
  // MRZ dates are in YYMMDD format
  const year = parseInt(mrzDate.substring(0, 2));
  const month = parseInt(mrzDate.substring(2, 4));
  const day = parseInt(mrzDate.substring(4, 6));

  // Determine century (assume 1900s for year > 50, 2000s otherwise)
  const fullYear = year > 50 ? 1900 + year : 2000 + year;

  const date = new Date(Date.UTC(fullYear, month - 1, day));
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert passport number to BigInt for circuit input
 */
export function passportNumberToBigInt(passportNumber: string): bigint {
  let result = BigInt(0);
  for (let i = 0; i < passportNumber.length; i++) {
    result = result * BigInt(256) + BigInt(passportNumber.charCodeAt(i));
  }
  return result;
}

/**
 * Map ISO country code to nationality code number
 */
export function countryCodeToNationalityCode(countryCode: string): number {
  // This is a simplified mapping
  // In production, use a complete ISO 3166-1 mapping
  const continentMap: { [key: string]: number } = {
    // Africa (1-100)
    DZ: 1,
    AO: 2,
    BJ: 3,
    BW: 4,
    BF: 5,
    BI: 6,
    CM: 7,
    CV: 8,
    CF: 9,
    TD: 10,
    KM: 11,
    CG: 12,
    CD: 13,
    CI: 14,
    DJ: 15,
    EG: 16,
    GQ: 17,
    ER: 18,
    ET: 19,
    GA: 20,
    GM: 21,
    GH: 22,
    GN: 23,
    GW: 24,
    KE: 25,
    LS: 26,
    LR: 27,
    LY: 28,
    MG: 29,
    MW: 30,
    ML: 31,
    MR: 32,
    MU: 33,
    MA: 34,
    MZ: 35,
    NA: 36,
    NE: 37,
    NG: 38,
    RW: 39,
    ST: 40,
    SN: 41,
    SC: 42,
    SL: 43,
    SO: 44,
    ZA: 45,
    SS: 46,
    SD: 47,
    SZ: 48,
    TZ: 49,
    TG: 50,
    TN: 51,
    UG: 52,
    ZM: 53,
    ZW: 54,

    // Asia (101-200)
    AF: 101,
    AM: 102,
    AZ: 103,
    BH: 104,
    BD: 105,
    BT: 106,
    BN: 107,
    KH: 108,
    CN: 109,
    GE: 110,
    IN: 111,
    ID: 112,
    IR: 113,
    IQ: 114,
    IL: 115,
    JP: 116,
    JO: 117,
    KZ: 118,
    KP: 119,
    KR: 120,
    KW: 121,
    KG: 122,
    LA: 123,
    LB: 124,
    MY: 125,
    MV: 126,
    MN: 127,
    MM: 128,
    NP: 129,
    OM: 130,
    PK: 131,
    PS: 132,
    PH: 133,
    QA: 134,
    SA: 135,
    SG: 136,
    LK: 137,
    SY: 138,
    TJ: 139,
    TH: 140,
    TL: 141,
    TR: 142,
    TM: 143,
    AE: 144,
    UZ: 145,
    VN: 146,
    YE: 147,

    // Europe (201-300)
    AL: 201,
    AD: 202,
    AT: 203,
    BY: 204,
    BE: 205,
    BA: 206,
    BG: 207,
    HR: 208,
    CY: 209,
    CZ: 210,
    DK: 211,
    EE: 212,
    FI: 213,
    FR: 214,
    DE: 215,
    GR: 216,
    HU: 217,
    IS: 218,
    IE: 219,
    IT: 220,
    XK: 221,
    LV: 222,
    LI: 223,
    LT: 224,
    LU: 225,
    MK: 226,
    MT: 227,
    MD: 228,
    MC: 229,
    ME: 230,
    NL: 231,
    NO: 232,
    PL: 233,
    PT: 234,
    RO: 235,
    RU: 236,
    SM: 237,
    RS: 238,
    SK: 239,
    SI: 240,
    ES: 241,
    SE: 242,
    CH: 243,
    UA: 244,
    GB: 245,
    VA: 246,

    // North America (301-400)
    AG: 301,
    BS: 302,
    BB: 303,
    BZ: 304,
    CA: 305,
    CR: 306,
    CU: 307,
    DM: 308,
    DO: 309,
    SV: 310,
    GD: 311,
    GT: 312,
    HT: 313,
    HN: 314,
    JM: 315,
    MX: 316,
    NI: 317,
    PA: 318,
    KN: 319,
    LC: 320,
    VC: 321,
    TT: 322,
    US: 323,

    // South America (401-500)
    AR: 401,
    BO: 402,
    BR: 403,
    CL: 404,
    CO: 405,
    EC: 406,
    GY: 407,
    PY: 408,
    PE: 409,
    SR: 410,
    UY: 411,
    VE: 412,

    // Oceania (501-600)
    AU: 501,
    FJ: 502,
    KI: 503,
    MH: 504,
    FM: 505,
    NR: 506,
    NZ: 507,
    PW: 508,
    PG: 509,
    WS: 510,
    SB: 511,
    TO: 512,
    TV: 513,
    VU: 514,

    // Antarctica (601-700)
    AQ: 601,
  };

  return continentMap[countryCode.toUpperCase()] || 0;
}

/**
 * Generate random nullifier secret
 */
export function generateNullifierSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}
