import * as _ from 'lodash';
import { inputModel, KeyPressDataModel } from './db';
import { BaseDbService } from './baseDbService';
import { Dictionary } from 'lodash';

interface KeyPressInfo {
    delay: number,
    expectedCharacter: string,
    character: string
}

export interface SequencePart {
    text: string,
    expected?: string,
    entered?: string,
    isCorrect: boolean
}

export interface SequenceInfo {
    text: string,
    sequenceId: number
}

export interface KeyInfo {
    ratio: number,
    total: number,
    misstypes: number
}

export const BACKSPACE = 'BKSP';


export class StatisticsService extends BaseDbService {

    private sequence: number = Date.now();
    private seqNumber: number = 0;
    private seqHasPresses: boolean = false;

    newSequence() {
        if (!this.seqHasPresses) {
            this.removeSequence(this.sequence);
        }

        this.sequence = Date.now();
        this.seqNumber = 0;
        this.seqHasPresses = false;

        this.doRq(db => db.put('sequences', {
            id: this.sequence,
            startDate: this.sequence
        }))
    }

    reportPress(keyPress: KeyPressInfo) {
        this.doRq(db => {
            this.seqHasPresses = true;
            return db.put('keypresses', inputModel({
                sequenceId: this.sequence,
                sequenceNumber: ++this.seqNumber,
                char: keyPress.character,
                delay: keyPress.delay,
                expected: keyPress.expectedCharacter
            }));
        });
    }


    getSequencesWithPresses = async () => {
        const presses = await this.getPresses();
        return _
            .chain(presses)
            .groupBy('sequenceId')
            .orderBy(p => p[0].sequenceId, 'desc')
            .map(p => ({ sequenceId: p[0].sequenceId, text: this.getText(p)}) as SequenceInfo)
            .value();
    }

    async removeSequence(sequenceId: number) {
        return this.doRq(async db => {
            const tx = db.transaction(['keypresses', 'sequences'], 'readwrite');

            const keypressesStore = tx.objectStore('keypresses');
            let presses = await keypressesStore.getAll();
            let ids = presses.filter(p => p.sequenceId == sequenceId).map(p => p.id);
            if (!ids.length) {
                return tx.done;
            }
            await keypressesStore.delete(IDBKeyRange.bound(Math.min(...ids), Math.max(...ids)));

            const sequencesStore = tx.objectStore('sequences');
            await sequencesStore.delete(sequenceId);

            return tx.done;
        });
    }


    private getText(presses: KeyPressDataModel[]) {
        return presses
            .filter(p => p.expected == p.char)
            .map(p => p.expected)
            .join('');
    }

    async getSequence(id: number) {
        const presses = await this.getPressesBkspCompensated();
        let seq = _.chain(presses)
            .filter(p => p.sequenceId == id)
            .orderBy('sequenceNumber', 'asc')
            .value();

        if (!seq) return [];

        const getChar = (k: KeyPressDataModel) => k.expected != k.char ? `${k.expected}[${k.char}]` : k.expected;

        let c: SequencePart = {
            text: getChar(seq[0]),
            isCorrect: seq[0].expected == seq[0].char
        }
        let result: SequencePart[] = [c];

        for (let i = 1; i < seq.length; i++) {
            let isCorrect = seq[i].expected == seq[i].char;
            if (c.isCorrect == isCorrect) {
                c.text += getChar(seq[i])
                c.expected = (c.expected || '') + seq[i].expected;
                c.entered = (c.entered || '') + seq[i].char;
            } else {
                c = {
                    text: getChar(seq[i]),
                    expected: seq[i].expected,
                    entered: seq[i].char,
                    isCorrect: seq[i].expected == seq[i].char
                }
                result.push(c);
            }
        }

        return result;
    }

    async getFailmap(): Promise<Dictionary<KeyInfo>> {
        const keypresses = await this.getPresses();

        return _
            .chain(keypresses)
            .groupBy(k => k.expected.toLowerCase())
            .map(p => {
                let key = p[0].expected.toLowerCase();
                const misstypes =  _.sumBy(p, p => Number(p.expected != p.char));
                let info: KeyInfo = { misstypes, total: p.length, ratio: misstypes / p.length };
                return [ key, info ] as const;
            })
            .fromPairs()
            .value();
    }

    async getStats() {
        const keypresses = await this.getPresses();

        const incorrectPresses = _
            .chain(keypresses)
            .filter(k => k.char != k.expected)
            .groupBy(k => k.expected)
            .orderBy(k => k.length, 'desc')
            .value();

        const sequences = _
            .chain(keypresses)
            .groupBy('sequenceId')
            .value();

        const problemWords: { [key: string]: string[] } = {};

        incorrectPresses.forEach(gr => {
            problemWords[gr[0].expected] = gr.map(p => {
                const seq = sequences[p.sequenceId];
                const idx = seq.findIndex(s => s.sequenceNumber == p.sequenceNumber);

                let word = [];
                // backwards
                for (let i = idx - 1; i > 0 && (idx - i) < 20; i--) {
                    let seqChar = seq[i];
                    if (seqChar.expected == ' ') break;
                    if (seqChar.expected == seqChar.char) {
                        word = [seqChar.expected, ...word];
                    }
                }
                // char
                word.push(`[${p.char}]`);
                // next
                for (let i = idx + 1; i < seq.length && (i - idx) < 20; i++) {
                    let seqChar = seq[i];
                    if (seqChar.expected == ' ') break;
                    if (seqChar.expected == seqChar.char) {
                        word.push(seqChar.expected);
                    }
                }
                return word.join('');
            })
        })

        console.log(incorrectPresses.map(p => {
            const cases = problemWords[p[0].expected].join('\n  ');
            return `${ p[0].char }: ${ p.length }\n${cases}`;
        }).join('\n'));
    }


    private async getPresses() {
        return this.doRq(db => db.getAll('keypresses').then(r => r.filter(a => a.char != BACKSPACE)));
    }

    private async getPressesBkspCompensated() {

        const presses = await this.doRq(db => db.getAll('keypresses'));
        const result: KeyPressDataModel[] = [];
        presses.forEach(p => {
            if (p.char != BACKSPACE) {
                result.push(p)
            } else {
                result.pop();
            }
        })
        return result;
    }
}

export const statisctisService = new StatisticsService()
statisctisService.newSequence();
