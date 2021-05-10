import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';

import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'

import './texts-screen.css';
import { defaultPageThreshold, defaultPatternsModel, TextModel } from '../../domain/db';
import { textsService } from '../../domain/textsService';
import * as _ from 'lodash';
import { PatternsEdit } from './PattersEdit';
import classNames from 'classnames';
import { Modal } from '../../common/Modal';

function stripHtml(html) {
    let tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

interface Props {
}

export function TextsScreen(props: Props) {
    const [texts, setTexts] = useState<TextModel[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [__, update] = useState<number>(0);
    const [patternEditorVisible, setPatternEditorVisibility] = useState(false);

    useEffect(() => {
        textsService.getTexts().then(setTexts);
    }, []);


    let currentTextModel = texts.find(t => t.id == selected);
    let savedRef = useMemo(() => React.createRef<HTMLDivElement>(), []);

    const onItemClick = useCallback((evt) => {
        setSelected(parseInt(evt.currentTarget.getAttribute('data-id')));
    }, []);
    const onRemoveClick = useCallback((evt: React.MouseEvent<HTMLElement>) => {
        var seqId = parseInt(evt.currentTarget.parentElement.parentElement.getAttribute('data-id'));
        setSelected(null);
        textsService.remove(seqId)
            .then(textsService.getTexts)
            .then(setTexts)
    }, []);
    const throttledUpdate = useCallback(_.debounce((name: string, text: string) => {
        textsService.updateText({
            text,
            base: currentTextModel.base,
            id: currentTextModel.id,
            name,
            patterns: currentTextModel.patterns,
            pageThreshold: currentTextModel.pageThreshold
        })
            .then(() => {
                savedRef.current.classList.remove('visible');
                setTimeout(() => savedRef.current.classList.add('visible'), 1);
            })
            .then(textsService.getTexts)
            .then(setTexts)
    }, 1000), [currentTextModel]);

    const onNameChanged = useCallback((e: ContentEditableEvent) => {
        throttledUpdate(stripHtml(e.target.value), currentTextModel.text)
    }, [throttledUpdate]);

    const createNew = useCallback(() => {
        textsService.updateText({
            name: '(new text)',
            base: false,
            text: 'Enter your text here',
            patterns: defaultPatternsModel,
            pageThreshold: defaultPageThreshold
        })
            .then(textsService.getTexts)
            .then(setTexts)
    }, []);

    const onPatternEdit = useCallback(() => {
        setPatternEditorVisibility(true);
    }, [selected]);

    const activeTextId = textsService.getActiveTextId();

    const closeModal = useCallback(() => setPatternEditorVisibility(false), []);

    let onTextAreaChange = useCallback(e => throttledUpdate(stripHtml(currentTextModel.name), stripHtml(e.target.value)), [throttledUpdate]);
    const onMakeActiveClick = useCallback(e => {
        textsService.setActiveTextId(e.currentTarget.getAttribute('data-id'));
        update(s => s + 1);
    }, []);
    return <div className={ 'texts-screen' }>
        <div className={ 'item-container' }>
            { texts.map(s => {
                return <div key={ s.id }
                            className={ classnames('item', { 'active': s.id == selected }) }
                            data-id={ s.id }
                            onClick={ onItemClick }>
                    <div className={ 'controls' }>
                        <button className={ classNames('btn s-circle', { 'btn-primary': activeTextId == s.id }) }
                                data-id={ s.id } onClick={ onMakeActiveClick }>
                            <i className="icon icon-check"/>
                        </button>
                        <button className="btn btn-action s-circle" data-id={ s.id } onClick={ onPatternEdit }><i
                            className="icon icon-menu"/></button>
                        { s.base
                            ? null
                            : <button className="btn btn-action s-circle" data-id={ s.id } onClick={ onRemoveClick }><i
                                className="icon icon-delete"/></button> }
                    </div>
                    <div className={ 'content' }>
                        <ContentEditable className={ 'header' } html={ s.name } onChange={ onNameChanged }/>
                        <div className={ 'preview' }>{ s.text.length } characters</div>
                    </div>
                </div>
            })
            }
            <button onClick={ createNew } className={ 'btn' }>Create new</button>
        </div>

        <div className={ 'selected-text-container' }>
            <div className={ 'saved toast toast-success' } ref={ savedRef }>Saved!</div>
            <div className={ 'selected-text' }>
                {
                    selected == null
                        ? <span className={ 'editable-text' }>No selected</span>
                        : <EditableTextArea initialValue={ currentTextModel?.text || '' }
                                            onChangeCallback={ onTextAreaChange }/>
                }
            </div>
            <Modal title={`Configuration for ${ currentTextModel?.name }`} shown={patternEditorVisible} onClose={closeModal}>
                <PatternsEdit activeText={ currentTextModel } save={ text => textsService.updateText(text)
                    .then(textsService.getTexts)
                    .then(setTexts)
                    .then(closeModal)
                }/>
            </Modal>
        </div>
    </div>
}

function EditableTextArea({ initialValue, onChangeCallback }) {
    initialValue = useMemo(() => initialValue, [initialValue]);
    const [value, setValue] = useState(initialValue);
    useEffect(() => {
        setValue(initialValue)
    }, [initialValue]);
    const onChanged = useCallback(e => {
        setValue(e.target.value);
        onChangeCallback(e);
    }, [onChangeCallback]);
    return <textarea value={ value } className={ 'editable-text' } onChange={ onChanged }/>
}
