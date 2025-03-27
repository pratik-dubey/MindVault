"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashGen = void 0;
const hashGen = (len) => {
    const options = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = options.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * length)];
    }
    console.log(`Generated Hash: ${ans} | Length: ${ans.length}`);
    return ans;
};
exports.hashGen = hashGen;
