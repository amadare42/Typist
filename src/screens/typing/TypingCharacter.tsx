import * as React from 'react';
import { CharModel } from './TypingPage';

export enum CharState {
    Normal = 0,
    Active = 1,
    Done = 2,
    Errored = 3,
    Warn = 4
}

interface Props {
    char: CharModel
}

export function TypingCharacter(props: Props) {
    const { char } = props;

    const nonPrintable = char.printable ? '' : ' not-printable';

    if (char.char == '\n') {
        return char.printable
            ? <>
                <span className={getClass(char.state) + ' specialchar'}>⏎</span>
                <br/>
            </>
            : <br/>;
    } else {
        return <span className={ getClass(char.state) + nonPrintable}>{ char.char }</span>;
    }
}

function getClass(state: CharState) {
    switch (state) {
        case CharState.Normal:
            return '';
        case CharState.Active:
            return 'active';
        case CharState.Errored:
            return 'errored';
        case CharState.Warn:
            return 'warn';
        case CharState.Done:
            return 'done';
    }
    return '';
}
