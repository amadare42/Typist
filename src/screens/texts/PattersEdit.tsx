import * as React from 'react';
import { TextModel } from '../../domain/db';
import { useCallback, useMemo } from 'react';
import { JsonEditorForm, TextConfiguration } from './JsonEditorForm';



export interface Props {
    activeText: TextModel,
    save: (model: TextModel) => void
}

export function PatternsEdit(props: Props) {
    const { activeText, save } = props;
    const json = useMemo(() => ({
        threshold: activeText.pageThreshold,
        patterns: activeText.patterns
    }), [activeText]);

    const onJsonChange = useCallback((config: TextConfiguration) => {
        save({
            ...activeText,
            patterns: config.patterns,
            pageThreshold: config.threshold
        })
    }, [save, activeText]);

    return <JsonEditorForm obj={json} onSave={onJsonChange} />
}
