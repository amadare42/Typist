import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardHeatmap } from './screens/heatmap/KeyboardHeatmap';
import { AnalysisScreen } from './screens/analysis/AnalysisScreen';
import classnames from 'classnames';
import { TextsScreen } from './screens/texts/TextsScreen';
import { TypingScreen } from './screens/typing/TypingScreen';

import "../data/spectre/spectre.min.css";
import "../data/spectre/spectre-exp.min.css";
import "../data/spectre/spectre-icons.min.css";

const screens = [
    {
        key: 'heatmap',
        title: 'Key analysis',
        component: () => <KeyboardHeatmap />
    },
    {
        key: 'analysis',
        title: 'Text analysis',
        component: () => <AnalysisScreen />
    },
    {
        key: 'typing',
        title: 'Typing',
        component: () => <TypingScreen />
    },
    {
        key: 'texts',
        title: 'Texts',
        component: () => <TextsScreen />
    },
]

function getScreen(key: string) {
    let screen = screens.find(s => s.key == key);
    return screen?.component() || <TextsScreen />;
}

export function App() {
    const [screen, setScreen] = useState(localStorage.getItem('screen') || 'texts');

    const updateScreen = useCallback((screen: string) => {
        localStorage.setItem('screen', screen);
        setScreen(screen);
    }, []);

    useEffect(() => {
        function keyup(evt: KeyboardEvent) {
            if (evt.key == 'Tab') {
                if (evt.shiftKey) {
                    setScreen(screen => {
                        let idx = screens.findIndex(s => s.key == screen);
                        idx--;
                        if (idx < 0) {
                            idx = screens.length - 1;
                        }
                        return screens[idx].key;
                    });
                } else {
                    setScreen(screen => {
                        let idx = screens.findIndex(s => s.key == screen);
                        idx++;
                        if (idx > screens.length - 1) {
                            idx = 0;
                        }
                        return screens[idx].key;
                    })

                }
                evt.preventDefault();
            }
        }
        document.addEventListener('keydown', keyup);
        return () => document.removeEventListener('keydown', keyup)

    }, [setScreen])

    return <div>
        <div>
            { getScreen(screen) }
        </div>
        <hr/>
        <div className={'screen-switch-controls'}>
            {
                screens.map(s => {
                    return <button onFocusCapture={noFocus} className={classnames({active: s.key == screen })} onClick={e => {
                        noFocus(e);
                        updateScreen(s.key);
                    }} key={s.key}>{s.title}</button>
                })
            }
        </div>
    </div>
}

function noFocus(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
}
