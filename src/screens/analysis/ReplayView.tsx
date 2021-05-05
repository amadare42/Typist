import * as React from 'react';

import { useEffect, useState } from 'react';
import { BACKSPACE, statisctisService } from '../../domain/statisticsService';
import { KeyPressDataModel } from '../../domain/db';
import { Progress } from '../../common/Progress';

interface Props {
    sequenceId: number
}

interface Range {
    val: number;
    max: number;
}
const zeroRange: Range = { val: 0, max: 1 };

interface State {
    time: Range;
    chars: Range;
    text: string;
}

export function ReplayView({ sequenceId }: Props) {
    let [state, setState] = useState<State>({  text: '', chars: zeroRange, time: zeroRange });

    useEffect(() => {
        const ticker = new Ticker(sequenceId, setState);
        return () => ticker.stop();
    }, [sequenceId, setState]);

    return <>
        <Progress value={state.chars.val} max={state.chars.max}  />
        <Progress value={state.time.val} max={state.time.max} colorOverride={'cornflowerblue'} />
        <span style={{ whiteSpace: 'pre-wrap'}}>{state.text}</span>
    </>
}

class Ticker {
    private presses: KeyPressDataModel[];
    public text = '';
    private idx = 0;
    private isStopped: boolean = false;
    private totalTime: number;
    private currentTime: number = 0;

    private updateTickerId: any = 0;
    private endTime: number;

    constructor(private sequenceId: number, private cb: (state: State) => void) {
        statisctisService.getAllPresses(sequenceId)
            .then(p => {
                this.presses = p;
                this.totalTime = p.reduce((acc, v) => acc + (v.delay || 0), 0);
                this.updateTickerId = setInterval(this.updateTicker, 50);
                this.endTime = Date.now() + this.totalTime;
            })
            .then(this.handle)
    }

    stop() {
        this.isStopped = true;
        clearInterval(this.updateTickerId);
    }

    updateTicker = () => {
        this.cb({
            text: this.text,
            time: {
                val: this.totalTime - (this.endTime - Date.now()),
                max: this.totalTime
            },
            chars: {
                val: this.idx,
                max: this.presses.length - 1
            }
        });
    }

    private handle = () => {
        if (this.isStopped || this.presses.length <= this.idx) {
            this.stop();
            return;
        }

        let press = this.presses[this.idx];
        this.currentTime += press.delay;
        setTimeout(() => {
            if (this.isStopped) return;
            if (press.char == BACKSPACE) {
                this.text = this.text.substring(0, this.text.length - 1);
            } else {
                this.text += getChar(press);
            }
            // this.cb({
            //     text: this.text,
            //     time: {
            //         val: this.currentTime,
            //         max: this.totalTime
            //     },
            //     chars: {
            //         val: this.idx,
            //         max: this.presses.length - 1
            //     }
            // });
            this.idx += 1;
            setTimeout(this.handle, 0);
        }, press.delay);
    }
}

function getChar({ char }: KeyPressDataModel) {
    if (char == '\n') return '⏎\n';
    if (char == ' ') return '·​';
    return char;
}
