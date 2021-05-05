import * as React from 'react';
import { useCallback, useState } from 'react';
import { KeyboardHeatmap } from './screens/heatmap/KeyboardHeatmap';
import { AnalysisScreen } from './screens/analysis/AnalysisScreen';
import classnames from 'classnames';
import { TextsScreen } from './screens/texts/TextsScreen';
import { TypingScreen } from './screens/typing/TypingScreen';

function getScreen(screen: string) {
    switch (screen) {
        case 'heatmap': return <KeyboardHeatmap />
        case 'analysis': return <AnalysisScreen />
        case 'typing': return <TypingScreen />
        case 'texts': return <TextsScreen />
    }
}

export function App() {
    const [screen, setScreen] = useState(localStorage.getItem('screen') || 'texts');

    const updateScreen = useCallback((screen: string) => {
        localStorage.setItem('screen', screen);
        setScreen(screen);
    }, []);

    return <div>
        <div>
            { getScreen(screen) }
        </div>
        <hr/>
        <div className={'screen-switch-controls'}>
            <button className={classnames({ active: screen == 'heatmap'})} onClick={() => updateScreen('heatmap')}>Key analysis</button>
            <button className={classnames({ active: screen == 'analysis'})} onClick={() => updateScreen('analysis')}>Text analysis</button>
            <button className={classnames({ active: screen == 'typing'})} onClick={() => updateScreen('typing')}>Typing</button>
            <button className={classnames({ active: screen == 'texts'})} onClick={() => updateScreen('texts')}>Texts</button>
        </div>
    </div>
}
