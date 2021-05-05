const polyfony = 12;

const success = Array.from(Array(polyfony).keys()).map(() => new Audio(require('../../../data/key.mp3')));
let sidx = 0;
const fail = Array.from(Array(polyfony).keys()).map(() => new Audio(require('../../../data/key_failed.mp3')));
let fidx = 0;

export function playSuccess() {
    success[sidx].play();
    sidx++;
    if (sidx >= success.length) {
        sidx = 0;
    }
}
export function playFail() {
    fail[fidx].play();
    fidx++;
    if (fidx >= success.length) {
        fidx = 0;
    }
}
