import * as React from 'react';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { PartType, SequencePart, statisctisService } from '../../domain/statisticsService';
import { ReplayView } from './ReplayView';
import classNames from 'classnames';
import { Loading } from '../../common/Loading';

interface Props {
    sequence: number
}

enum AnalysisTab {
    Analysis,
    Raw,
    Replay
}

export function AnalysisPage(props: Props) {
    const [tab, setTab] = useState(AnalysisTab.Analysis);

    const onTabClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        let tab = parseInt(e.currentTarget.getAttribute('data-tab')) as AnalysisTab;
        setTab(tab);
    }, [setTab]);

    return <>
        <ul className="tab tab-block">
            <li className={classNames("tab-item", {active: tab == AnalysisTab.Analysis})} >
                <a href="#" data-tab={AnalysisTab.Analysis} onClick={onTabClick}>Analysis</a>
            </li>
            <li className={classNames("tab-item", {active: tab == AnalysisTab.Raw})}>
                <a href="#" data-tab={AnalysisTab.Raw} onClick={onTabClick}>Raw text</a>
            </li>
            <li className={classNames("tab-item", {active: tab == AnalysisTab.Replay})}>
                <a href="#" data-tab={AnalysisTab.Replay} onClick={onTabClick}>Replay</a>
            </li>
        </ul>

        {
            tab == AnalysisTab.Analysis
                ? <AnalysisView sequence={props.sequence} />
                : tab == AnalysisTab.Raw
                    ? <RawView sequence={props.sequence} />
                    : <ReplayView sequenceId={props.sequence} />
        }
    </>
}


function RawView(props: Props) {
    const { sequence } = props;
    const [text, setText] = useState<string>('Loading...');
    useEffect(() => {
        statisctisService.getTextForSequence(sequence).then(t => setText(t.replace('\n', '⏎')));
    }, [sequence]);
    return <>{text}</>;
}

function AnalysisView(props: Props) {
    const { sequence } = props;
    const [parts, setParts] = useState<SequencePart[]>(null);
    useEffect(() => {
        statisctisService.getSequence(props.sequence).then(setParts);
    }, [sequence]);
    return <>{parts ? parts.map(renderPart) : <Loading />}</>;

}

function renderPart(p: SequencePart, i: number) {
    switch (p.type) {
        case PartType.Correct:
            return <span className={'part done tooltip tooltip-bottom'} data-tooltip={`Chars: ${p.text.length}, WPM: ${p.wpm}`} key={i}>{p.text}</span>
        case PartType.Erased:
            return <span className={'part corrected tooltip tooltip-bottom'} data-tooltip={`corrected "${p.text}"`} key={i}>{p.text}</span>
        case PartType.Wrong:
            return <span className={'errored tooltip tooltip-bottom part'} key={i} data-tooltip={`expected: "${p.expected}"`}>{p.text}</span>;
    }

    return '';
}
