import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TypingPage } from './TypingPage';
import * as _ from 'lodash';
import { statisctisService } from '../../domain/statisticsService';
import { findRanges } from './textParsing';
import { ActiveTextModel, textsService } from '../../domain/textsService';
import { ReplacementPatternModel } from '../../domain/db';

interface Props {
    textModel: ActiveTextModel
}

interface State {
    pages: string[],
    currentPage: number,
    pageInput: string,
    updateIdx: number
}

function stopPropagation(e) {
    e.stopPropagation();
}

function savePosition(id: number, pages: string[], currentPage: number) {
    const position = !currentPage
        ? 0
        : _.chain(pages)
            .take(currentPage)
            .map(p => p.length)
            .sum()
            .value() + 1;
    console.log('position saved', { currentPage, position });
    textsService.savePosition(id, position);
}

export function Pager(props: Props) {
    const [state, setState] = useState<State>(() => {
        let { pages, activePage } = splitToPages(props.textModel);

        return ({
            pages,
            currentPage: activePage,
            pageInput: (activePage + 1).toString(),
            updateIdx: 0
        });
    });

    // will mount
    useEffect(() => statisctisService.newSequence(props.textModel.id, props.textModel.name), []);

    const changePage = useCallback((page: number, stateMixin: Partial<State> = {}) => {
        setState(state => {
            savePosition(props.textModel.id, state.pages, page);
            statisctisService.newSequence(props.textModel.id, props.textModel.name);
            return { ...state, ...stateMixin, currentPage: page, pageInput: (page + 1).toString(), updateIdx: state.updateIdx + 1 };
        });
    }, [props]);

    const onPageInputChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        let page = parseInt(e.target.value);
        if (!page || isNaN(page) || page < 1 || page > state.pages.length) {
            setState(state => ({ ...state, pageInput: e.target.value }));
            return;
        }
        changePage(page - 1);
    }, []);

    const nextPage = useCallback(() => {
        changePage(currentPage + 1 >= pages.length ? currentPage : currentPage + 1);
    },[state]);
    const prevPage = useCallback(() => {
        changePage(currentPage - 1 < 0 ? currentPage : currentPage - 1);
    },[state]);
    const noFocus = useCallback((e: React.MouseEvent<HTMLElement>) => {
        console.log('focus');
        e.nativeEvent.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
    }, []);

    useEffect(() => {
        let keyUp = k => {
            switch (k.key) {
                case 'ArrowLeft':
                    k.preventDefault();
                    prevPage();
                    break;
                case 'ArrowRight':
                    k.preventDefault();
                    nextPage();
                    break;
                case 'ArrowUp':
                    k.preventDefault();
                    setState(state => ({...state, updateIdx: state.updateIdx + 1}));
                    statisctisService.newSequence(props.textModel.id, props.textModel.name);
                    break;
            }
        };
        document.addEventListener('keyup', keyUp);
        return () => {
            document.removeEventListener('keyup', keyUp);
        }
    }, [prevPage, nextPage, changePage, props]);

    const { pages, currentPage } = state;
    const percentage = useMemo(() => {
        var currentTotal = _.chain(pages).take(currentPage).map(p => p.length).sum().value();
        return _.round(
            currentTotal
            / (_.chain(pages).map(p => p.length).sum().value())
            * 100
        , 2);
    }, [pages, currentPage])

    let charsLen = 0;
    for (let i = 0; i < state.currentPage; i++) {
        charsLen += state.pages.length;
    }

    return <div>
        <TypingPage text={pages[currentPage]} nextPage={nextPage} key={state.updateIdx}
                    ignorePatterns={props.textModel.patterns.ignorePatterns} />
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
                Page
                <button onClick={prevPage} onMouseDown={noFocus} className={'btn'}>{"<"}</button>
                <input onKeyDown={stopPropagation} onKeyUp={stopPropagation} className={'page-input'} value={state.pageInput} onChange={onPageInputChanged} />
                / <span style={{width: '3em'}}>{ state.pages.length }</span>
                <button onClick={nextPage} onMouseDown={noFocus} className={'btn'}>{">"}</button>
            </div>
            <span>{ pages[currentPage].length } chars</span>
            <span>{ percentage }%</span>
        </div>
    </div>
}

function mapReplacement(replacement: ReplacementPatternModel) {
    return [
        replacement.search,
        replacement.replace.replace(/\\n/g, '\n')
    ] as const
}

function splitToPages(textModel: ActiveTextModel) {
    const { replacementPatterns, breakPatterns } = textModel.patterns;
    let { text, pageThreshold, position } = textModel;

    const pages: string[] = [];
    let activePage = 0;

    replacementPatterns.map(mapReplacement).forEach(([pattern, replacement]) => {
        text = text.replace(new RegExp(pattern, 'gm'), replacement)
    });

    if (pageThreshold > text.length) return { pages: [text], activePage };

    let breakRanges = _
        .chain(breakPatterns)
        .map(p => new RegExp(p, 'gm'))
        .map(p => findRanges(text, p))
        .flatten()
        .orderBy(r => r.index)
        .value();

    let start = 0;
    let len = 0;
    for (start = 0; start < text.length - pageThreshold;) {
        let thresholdStart = start + pageThreshold;
        let range = breakRanges.find(r => r.index >= thresholdStart);
        if (!range) {
            break;
        }
        var page = text.substring(start, range.end);
        len += page.length;
        pages.push(page);
        if (!activePage && position && position < len) {
            console.log('active page set on', { start, end: range.end, page: pages.length - 1, range, position });
            activePage = pages.length - 1;
        }
        start = range.end + 1;
    }
    pages.push(text.substring(start, text.length));

    console.group('break to pages')
    console.log(pages.slice(0, 5));
    console.log(pages.slice(0, 5).reduce((acc, p) => ([...acc, { t: (acc[0]?.t || 0) + p.length, l: p.length}]), []));
    console.log({ activePage, position });

    console.groupEnd();

    return { pages, activePage };
}
