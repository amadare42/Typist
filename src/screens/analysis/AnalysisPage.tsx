import * as React from 'react';
import { SequencePart, statisctisService } from '../../domain/statisticsService';
import { useEffect, useState } from 'react';

interface Props {
    sequence: number
}

export function AnalysisPage(props: Props) {
    const [parts, setParts] = useState<SequencePart[]>([]);

    useEffect(() => {
        statisctisService.getSequence(props.sequence).then(setParts);
    }, [props.sequence])

    return <>
        {parts.map(renderPart)}
    </>
}


function renderPart(p: SequencePart, i: number) {
    if (p.isCorrect) {
        return <span className={'part done'} key={i}>{p.text}</span>
    }

    return <span className={'errored tooltip tooltip-bottom part'} key={i} data-tooltip={`expected: "${p.expected}", entered: "${p.entered}"`}>{p.text}</span>;
}
