import * as React from 'react';
import { useEffect, useState } from 'react';
import { CharState, TypingCharacter } from './TypingCharacter';
import { Stats } from './Stats';
import * as _ from 'lodash';
import { findPatterns } from './textParsing';
import { BACKSPACE, statisctisService } from '../../domain/statisticsService';
import { playFail, playSuccess } from './typingAudio';


interface Props {
    text: string,
    ignorePatterns?: string[],
    nextPage: () => void
}

export interface CharModel {
    char: string,
    state: CharState,
    printable: boolean
}

interface State {
    currentIdx: number,
    isRunning: boolean,
    startedAt?: number,
    timestamps: number[],
    chars: CharModel[],
    errors: number,
    completedTime: number | undefined
}

const rightShiftChars = 'qazwsxedcrfvtgb'.toUpperCase();

let savedState: State = null;

function mapText(text: string, notPrintablePatterns?: string[]) {
    let chars: CharModel[] = [];

    let npi = 0;
    let nonPrintable = notPrintablePatterns && findPatterns(text, notPrintablePatterns) || null;
    let hasActive = false;

    for (let i = 0; i < text.length; i++) {
        if (nonPrintable && nonPrintable[npi]) {
            let rangeResult = nonPrintable[npi];

            if (i == rangeResult.index) {
                chars.push({
                    printable: false,
                    char: text.substring(rangeResult.index, rangeResult.end),
                    state: CharState.Normal
                });
                npi++;
                i += rangeResult.end - rangeResult.index - 1;
                continue;
            }
        }

        let char = text[i];
        if (!hasActive) {
            chars.push({ printable: true, char, state: CharState.Active });
            hasActive = true;
        } else {
            chars.push({ printable: true, char, state: CharState.Normal });
        }
    }

    console.log({ nonPrintable, chars });

    return chars;
}

function getPrevChars(state: State) {
    let result = [];
    for (let i = state.currentIdx - 1; i >= 0; i--)
    {
        const char = state.chars[i];
        if (!char.printable || state.currentIdx - i > 4) {
            break;
        }
        result.push(char.char);
    }
    return result.reverse();
}


export function TypingPage(props: Props) {

    const [state, setState] = useState<State>(() => {
        let chars = mapText(props.text, props.ignorePatterns);
        return {
            currentIdx: chars.findIndex(c => c.printable),
            isRunning: false,
            timestamps: [],
            errors: 0,
            chars: chars,
            completedTime: undefined
        };
    });
    savedState = state;


    useEffect(() => {
        let shiftState: ShiftState = {
            left: false,
            right: false
        };


        function isCorrectShift(enteredChar: string) {
            if (!shiftState.left && !shiftState.right) return true;

            return (enteredChar == enteredChar.toUpperCase() && enteredChar != enteredChar.toLowerCase())
                ? rightShiftChars.includes(enteredChar)
                    ? shiftState.right
                    : shiftState.left
                : true;
        }

        function keydown(e: KeyboardEvent) {
            if (handleShiftState(e, false, shiftState))
                return;

            let enteredChar = isCharacterKeyPress(e)
                ? e.key
                : e.key == "Enter"
                    ? '\n'
                    : null;

            if (e.key == "Enter" && savedState.completedTime) {
                props.nextPage();
            }
            const timestamp = Date.now();

            if (enteredChar) {

                setState(state => {
                    const { chars, currentIdx, startedAt } = state;

                    const isCorrect = enteredChar == chars[currentIdx].char;
                    if (isCorrect) {
                        playSuccess();
                    } else {
                        playFail()
                    }
                    let nextIdx = currentIdx;
                    while (nextIdx < chars.length - 1) {
                        nextIdx += 1;
                        if (chars[nextIdx].printable) break;
                    }


                    if (state.timestamps.length) {
                        statisctisService.reportPress({
                            character: enteredChar,
                            expectedCharacter: state.chars[state.currentIdx].char,
                            delay: timestamp - state.timestamps[state.timestamps.length - 1]
                        })
                    }

                    return {
                        ...state,
                        isRunning: true,
                        startedAt: startedAt || Date.now(),
                        currentIdx: nextIdx,
                        errors: isCorrect ? state.errors : state.errors + 1,
                        timestamps: isCorrect ? [...state.timestamps, timestamp] : state.timestamps,
                        chars: chars.map((c, idx) => {
                            if (idx == currentIdx) {
                                return { ...c, state: isCorrect
                                        ? isCorrectShift(enteredChar)
                                            ? CharState.Done
                                            : CharState.Warn
                                        : CharState.Errored };
                            } else if (idx == nextIdx) {
                                return { ...c, state: CharState.Active };
                            }
                            return c;
                        }),
                        completedTime: nextIdx == currentIdx ? Date.now() : undefined
                    }
                });
            } else if (e.key == "Backspace") {
                setState(state => {
                    const { chars, currentIdx, timestamps } = state;
                    let nextIdx = currentIdx;
                    while (nextIdx > 0) {
                        nextIdx -= 1;
                        if (chars[nextIdx].printable) break;
                    }


                    if (!chars[nextIdx].printable) return state;

                    statisctisService.reportPress({
                        character: BACKSPACE,
                        expectedCharacter: state.chars[state.currentIdx].char,
                        delay: state.timestamps.length ? timestamp - state.timestamps[state.timestamps.length - 1] : 0
                    });

                    return {
                        ...state,
                        currentIdx: nextIdx,
                        timestamps: timestamps.slice(0, -1),
                        chars: chars.map((c, idx) => {
                            if (idx == currentIdx) {
                                return { ...c, state: idx == 0 ? CharState.Active : CharState.Normal };
                            }
                            else if (idx == nextIdx) {
                                return { ...c, state: CharState.Active };
                            }
                            return c;
                        })
                    }
                });
            }
        }

        function keyup(e: KeyboardEvent) {
            if (handleShiftState(e, true, shiftState))
                return;
        }

        document.addEventListener('keydown', keydown);
        document.addEventListener('keyup', keyup);
        return () => {
            document.removeEventListener('keydown', keydown);
            document.removeEventListener('keyup', keyup);
        }
    }, [])

    return <div>
        <Stats timestamps={state.timestamps} startedAt={state.startedAt} errors={state.errors} completedTime={state.completedTime} />
        <div style={{ display: 'flex', justifyContent: 'center'}}>
            <div>
                { state.chars.map((c, i) => {
                    return <TypingCharacter char={ c } key={ i }/>;
                }) }
            </div>
        </div>
    </div>;
}

interface ShiftState {
    left: boolean,
    right: boolean
}

function handleShiftState(e: KeyboardEvent, isUp: boolean, state: ShiftState) {
    if (e.key != "Shift") return;

    if (e.location == 2) {
        state.right = !isUp;
    } else {
        state.left = !isUp
    }
    return true;
}

const allowedKeys = "qazwsxedcrfvtgbyhnujmik,ol.p;/[']\\<>?|\":}{1234567890-=!@#$%^&*()_+ \t`~йфяцічувскамепинртгоьшлбщдюзжхєї";

function isCharacterKeyPress(evt: KeyboardEvent) {
    if (evt.key.length > 1)
        return false;
    return allowedKeys.includes(evt.key.toLowerCase());
}
