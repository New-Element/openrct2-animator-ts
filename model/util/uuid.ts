/**
 * UUID v4 for plugin runtime (no crypto API required).
 */
export default function uuidV4(): string {
    let result = "";
    for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            result += "-";
        } else if (i === 14) {
            result += "4";
        } else if (i === 19) {
            result += (8 + Math.floor(Math.random() * 4)).toString(16);
        } else {
            result += Math.floor(Math.random() * 16).toString(16);
        }
    }
    return result;
}
