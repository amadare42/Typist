import * as React from 'react';
import { useCallback } from 'react';
import classNames from 'classnames';

interface Props {
    title: string,
    children: JSX.Element,
    footer?: JSX.Element,
    shown: boolean,
    onClose: () => void
}

interface State {
    isShown: boolean;
    updateIdx: number;
    propUpdateIdx: number;
}

export function Modal(props: Props) {
    const { title, children, footer, shown, onClose } = props;
    useCallback((e: MouseEvent) => {
        e.preventDefault();
        onClose();
    }, [onClose]);
    if (!props.shown) return null;

    return <div className={ classNames('modal', { active: shown }) } id="modal-id">
        <a href="#close" className="modal-overlay" aria-label="Close"
           onClick={ onClose }/>
        <div className="modal-container">
            <div className="modal-header">
                <a href="#close" className="btn btn-clear float-right" aria-label="Close" onClick={ onClose }/>
                <div className="modal-title h5">{ title }</div>
            </div>
            <div className="modal-body">
                <div className="content">
                    { children }
                </div>
            </div>
            <div className="modal-footer">
                { footer || null }
            </div>
        </div>
    </div>;
}
