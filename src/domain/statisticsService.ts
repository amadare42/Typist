import * as _ from 'lodash';
import { inputModel, KeyPressDataModel } from './db';
import { BaseDbService } from './baseDbService';
import { Dictionary } from 'lodash';
import { areNeighbors } from '../screens/heatmap/keymap';

interface KeyPressInfo {
    delay: number,
    expectedCharacter: string,
    character: string
}

export enum PartType {
    Correct,
    Erased,
    Wrong
}

export enum TypoType {
    WrongKey,
    WrongNeighborKey,
    WrongOrder,
    Duplication,
    MissedKey,
    WrongCase = 5
}

export interface TyposInfo {
    [char: string]: TyposSummaryReport;
}

export type TyposSummaryReport = {
    typeTypes:  { [key in TypoType]?: number };
    typoChars: {  [char: string]: number }
};

export interface SequencePart {
    text: string,
    expected?: string,
    wpm?: number,
    type: PartType
}

export interface SequenceInfo {
    text: string,
    sequenceId: number,
    sequenceName: string
}

export interface KeyInfo {
    ratio: number,
    total: number,
    misstypes: number,
    // typos: TyposSummaryReport
}

export const BACKSPACE = 'BKSP';

function calcWpm(chars: number | string, timeMs: number) {
    let len = typeof chars == 'number' ? chars : chars.length;
    if (!timeMs || !len) return 0;

    let msPerChar = timeMs / len;
    return _.floor(((60 * 1000) / msPerChar) / 5);
}


export class StatisticsService extends BaseDbService {

    private sequence: number = Date.now();
    private seqNumber: number = 0;
    private seqHasPresses: boolean = false;

    newSequence(textId: number, textName: string) {
        if (!this.seqHasPresses) {
            this.removeSequence(this.sequence);
        }

        this.sequence = Date.now();
        this.seqNumber = 0;
        this.seqHasPresses = false;

        this.doRq(db => db.put('sequences', {
            id: this.sequence,
            startDate: this.sequence,
            textId,
            textName
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

    async getTotalTyposClassification() {
        const presses = await this.getPresses();
        const report: TyposInfo = {};

        for (let pressIndex = 0; pressIndex < presses.length; pressIndex++) {
            const press = presses[pressIndex];
            if (press.char == BACKSPACE) continue;

            if (press.expected != press.char) {
                const iterate = (omit: number = 1) => _.chain(presses)
                    .drop(pressIndex + omit)
                    .filter(p => p.char != BACKSPACE);

                function process() {

                    // wrong case
                    if (press.expected.toLowerCase() == press.char.toLowerCase()) {
                        return TypoType.WrongCase;
                    }

                    // duplication
                    const isDuplicated = iterate(1).take(1).every(p => {
                        return p.char == press.char;
                    }).value();
                    if (isDuplicated) {
                        pressIndex++;
                        return TypoType.Duplication;
                    }

                    const isWrongOrder = iterate().take(1).every(p => p.char == press.expected && p.expected == press.char).value();
                    if (isWrongOrder) {
                        pressIndex++;
                        return TypoType.WrongOrder;
                    }

                    let nextPresses = iterate(0).take(3).value();
                    const isMissedKey = nextPresses.every((p, idx) => {
                        if (!idx) return true;
                        return p.expected == nextPresses[idx - 1].char;
                    });
                    if (isMissedKey) {
                        pressIndex += 2;
                        return TypoType.MissedKey;
                    }

                    if (areNeighbors(press.expected, press.char)) {
                        return TypoType.WrongNeighborKey;
                    }

                    return TypoType.WrongKey;
                }

                let expected = press.expected.toLowerCase();
                let type = process();
                let info = report[expected] || (report[expected] = { typeTypes: {}, typoChars: {} });
                info.typeTypes[type] = (info[type] || 0) + 1;
                info.typoChars[press.char] = (info.typoChars[press.char] || 0) + 1;
            }
        }

        return report;
    }


    getSequencesWithPresses = async () => {
        const presses = await this.getPressesBkspCompensated();
        const promises = _
            .chain(presses)
            .groupBy('sequenceId')
            .orderBy(p => p[0].sequenceId, 'desc')
            .take(500)
            .map(p => [p, this.doRq(db => db.get('sequences', p[0].sequenceId))] as const)
            .map(async ([p, sequencePromise]) => ({
                sequenceId: p[0].sequenceId,
                text: this.getText(p),
                sequenceName: (await sequencePromise).textName
            }) as SequenceInfo)
            .value();
        let sequences = await Promise.all(promises);
        return sequences.filter(s => s.text.length > 0);
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

    async getTextForSequence(id: number) {
        return this.getText(await this.getPressesBkspCompensated(id));
    }

    async getSequence(id: number) {
        const presses = await this.getAllPresses();
        let seq = _.chain(presses)
            .filter(p => p.sequenceId == id)
            .orderBy('sequenceNumber', 'asc')
            .value();

        if (!seq) return [];

        let part: SequencePart = {
            text: seq[0].char,
            expected: seq[0].expected,
            // assuming first press cannot be backspace
            type: seq[0].char == seq[0].expected ? PartType.Correct : PartType.Wrong
        }
        const parts: SequencePart[] = [part];
        let charactersToErase = 0;
        let correctDuration = 0;

        for (let i = 1; i < seq.length; i++) {
            const press = seq[i];

            // Erased
            if (press.char == BACKSPACE) {
                charactersToErase++;
                continue;
            }
            else if (charactersToErase) {
                for (let partIdx = parts.length - 1; partIdx >= 0 && charactersToErase > 0; partIdx--) {
                    let currentPart = parts[partIdx];
                    if (currentPart.type == PartType.Erased) continue;

                    // split part
                    if (currentPart.text.length > charactersToErase) {
                        let textLeft = currentPart.text.substring(0, currentPart.text.length - charactersToErase);
                        let textRight = currentPart.text.substring(currentPart.text.length - charactersToErase);
                        parts.splice(partIdx + 1, 0, part = {
                            type: PartType.Erased,
                            text: textRight
                        });
                        currentPart.text = textLeft;
                        charactersToErase = 0;
                    }
                    else {
                        // convert part
                        currentPart.type = PartType.Erased;
                        charactersToErase -= currentPart.text.length;
                    }
                }
            }

            // entered character
            const type = press.char == press.expected ? PartType.Correct : PartType.Wrong;
            // concat
            if (part.type == type) {
                part.text += press.char;
                part.expected += press.expected
                if (type == PartType.Correct) correctDuration += press.delay;
            } else {
                if (part.type == PartType.Correct) {
                    part.wpm = calcWpm(part.text, correctDuration)
                    correctDuration = 0;
                }
                if (type == PartType.Correct) {
                    correctDuration = press.delay;
                }
                // create new
                parts.push(part = {
                    type,
                    text: press.char,
                    expected: press.expected
                });
            }
        }

        // in case last block was correct, wpm will not be populated
        const last = parts[parts.length - 1];
        if (last.type == PartType.Correct && !last.wpm) {
            last.wpm = calcWpm(last.text, correctDuration);
        }

        return parts;
    }

    async getFailmap(): Promise<Dictionary<KeyInfo>> {
        const keypresses = await this.getPresses();
        // const typos = await this.getTotalTyposClassification();

        return _
            .chain(keypresses)
            .groupBy(k => k.expected.toLowerCase())
            .map(p => {
                let key = p[0].expected.toLowerCase();
                const misstypes = _.sumBy(p, p => Number(p.expected != p.char));
                let info: KeyInfo = {
                    misstypes,
                    total: p.length,
                    ratio: misstypes / p.length,
                    // typos: typos[p[0].expected] || { typoChars: {}, typeTypes: {} }
                };
                return [key, info] as const;
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
                word.push(`[${ p.char }]`);
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
            return `${ p[0].char }: ${ p.length }\n${ cases }`;
        }).join('\n'));
    }


    private async getPresses() {
        return this.doRq(db => db.getAll('keypresses').then(r => r.filter(a => a.char != BACKSPACE)));
    }

    public async getAllPresses(): Promise<KeyPressDataModel[]>;
    public async getAllPresses(sequenceId: number): Promise<KeyPressDataModel[]>;
    async getAllPresses(sequenceId?: number) {
        return this.doRq(db => sequenceId
            ? db.getAllFromIndex('keypresses', 'by-sequenceId', sequenceId)
            : db.getAll('keypresses')
        );
    }

    private async getPressesBkspCompensated(): Promise<KeyPressDataModel[]>;
    private async getPressesBkspCompensated(sequenceId: number): Promise<KeyPressDataModel[]>;
    private async getPressesBkspCompensated(sequenceId?: number): Promise<KeyPressDataModel[]> {

        const presses = await this.getAllPresses(sequenceId);
        const result: KeyPressDataModel[] = [];
        presses.forEach(p => {
            if (p.char != BACKSPACE) {
                result.push(p)
            } else if (result.length && result[result.length - 1].sequenceId == p.sequenceId) {
                result.pop();
            }
        })
        return result;
    }
}

export const statisctisService = new StatisticsService();
