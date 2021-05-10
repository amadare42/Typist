import * as React from 'react';
import { ActiveTextModel, textsService } from '../../domain/textsService';
import { useEffect, useState } from 'react';
import { Loading } from '../../common/Loading';
import { Pager } from './Pager';
import './typing-screen.css';

export function TypingScreen() {
    const [activeText, setActiveText] = useState<ActiveTextModel | 'loading'>('loading')

    useEffect(() => {
        textsService.getActiveText()
            .then(setActiveText);
    }, [])

    if (activeText == 'loading') return <Loading />
    if (!activeText) return <div>No text selected</div>;

    return <Pager textModel={activeText} />
}
