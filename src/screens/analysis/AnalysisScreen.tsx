import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SequenceInfo, statisctisService } from '../../domain/statisticsService';
import { AnalysisPage } from './AnalysisPage';
import classnames from 'classnames';


import './analysis-screen.css';
import { Loading } from '../../common/Loading';

export function AnalysisScreen() {
    const [sequences, setSequences] = useState<SequenceInfo[]>(null);
    const [selectedSequence, setSelectedSequence] = useState<number | null>(null);

    const updateSequences = useCallback(() => { statisctisService.getSequencesWithPresses().then(setSequences); }, [setSequences]);
    useEffect(updateSequences, []);

    const onItemClick = useCallback((evt: React.MouseEvent<HTMLDivElement>) =>
        setSelectedSequence(parseInt(evt.currentTarget.getAttribute('data-sequenceid'))), []);

    const onDeleteClick = useCallback((evt: React.MouseEvent<HTMLElement>) => {
        const seqId = parseInt(evt.currentTarget.parentElement.parentElement.getAttribute('data-sequenceid'));
        statisctisService.removeSequence(seqId).then(updateSequences)
    }, []);

    return <div className={'analysis-screen'}>
        <div className={'item-container'}>
            {
                sequences?.map(s => {
                    return <div key={s.sequenceId}
                                className={classnames('item', { 'active': s.sequenceId == selectedSequence})}
                                data-sequenceid={s.sequenceId} onClick={onItemClick}>
                        <div className={'controls'}>
                            <button className="btn btn-action s-circle" onClick={ onDeleteClick }>
                                <i className="icon icon-delete"/>
                            </button>
                        </div>
                        <div className={'content'}>
                            <div className={'header'}>{s.sequenceName}</div>
                            <div className={'header-subtext'}>{formatDate(s.sequenceId)} ({s.text.length} chars)</div>
                            <div className={'preview'}>{s.text.substring(0, 500)}</div>
                        </div>
                    </div>
                }) || <Loading />
            }
            { sequences?.length == 500 ? <span>Only first 500 sequences are shown</span> : null }
        </div>
        <div className={'selected-sequence'}>
            { selectedSequence == null ? <span>No sequence selected</span> : <AnalysisPage sequence={selectedSequence} /> }
        </div>

    </div>
}

function formatDate(date: number) {
    return new Date(date).toLocaleString();
}
