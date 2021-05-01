import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SequenceInfo, SequencePart, statisctisService } from '../../domain/statisticsService';
import { AnalysisPage } from './AnalysisPage';
import classnames from 'classnames';


import './analysis-screen.css';

interface Props {
}

export function AnalysisScreen(props: Props) {
    const [sequences, setSequences] = useState<SequenceInfo[]>([]);
    const [selectedSequence, setSelectedSequence] = useState<number | null>(null);

    useEffect(() => {
        statisctisService.getSequencesWithPresses().then(setSequences);
    }, []);

    const onItemClick = useCallback((evt: React.MouseEvent<HTMLDivElement>) => {
        setSelectedSequence(parseInt(evt.currentTarget.getAttribute('data-sequenceid')));
    }, []);

    const onDeleteClick = useCallback((evt: React.MouseEvent<HTMLElement>) => {
        var seqId = parseInt(evt.currentTarget.parentElement.parentElement.getAttribute('data-sequenceid'));
        statisctisService.removeSequence(seqId)
            .then(statisctisService.getSequencesWithPresses)
            .then(setSequences)
    }, []);


    return <div className={'analysis-screen'}>
        <div className={'item-container'}>
            { sequences.map(s => {
                return <div key={s.sequenceId}
                            className={classnames('item', { 'active': s.sequenceId == selectedSequence})}
                            data-sequenceid={s.sequenceId} onClick={onItemClick}>
                    <div className={'controls'}>
                        <button className="btn btn-action s-circle" onClick={ onDeleteClick }><i
                            className="icon icon-delete"/></button>
                        {/*<button onClick={onDeleteClick}>🗑️</button>*/}
                    </div>
                    <div className={'content'}>
                        <div className={'header'}>{formatDate(s.sequenceId)}</div>
                        <div className={'preview'}>{s.text}</div>
                    </div>
                </div>
            })
            }
        </div>
        <div className={'selected-sequence'}>
            { selectedSequence == null ? <span>No selected</span> : <AnalysisPage sequence={selectedSequence} /> }
        </div>

    </div>
}

function formatDate(date: number) {
    return new Date(date).toLocaleString();
}
