import * as React from 'react';
import { JSONEditor } from '@json-editor/json-editor/dist/jsoneditor';
import { PatternsModel } from '../../domain/db';


JSONEditor.defaults.options.theme = 'spectre';
JSONEditor.defaults.options.iconlib = "spectre";

interface Props {
    obj: TextConfiguration,
    onSave: (config: TextConfiguration) => void
}

export interface TextConfiguration {
    patterns: PatternsModel,
    threshold: number
}


const schema = {
    title: 'Configuration',
    properties: {
        patterns: {
            properties: {
                ignorePatterns: {
                    title: 'Patterns to ignore',
                    type: 'array',
                    items: { type: 'string', title: 'pattern' }
                },
                replacementPatterns: {
                    title: 'Patterns to replace',
                    type: 'array',
                    items: {
                        type: 'array',
                        title: 'replacement',
                        items: [{ type: 'string', title: 'Search', minLength: 1 }, { type: 'string', title: 'Replace', minLength: 1 }],
                        additionalItems: false,
                        minItems: 2
                    }
                },
                breakPatterns: {
                    title: 'Break patterns',
                    type: 'array',
                    items: { type: 'string', title: 'Pattern', minLength: 1 }
                }
            },
            required: ['ignorePatterns', 'replacementPatterns', 'breakPatterns']
        },
        threshold: {
            title: 'After how many symbols try to break the page',
            type: 'number',
            min: 0
        }
    }
};

interface EditorSnapshot {
    isValid: boolean,
    value: any
}

interface EditorComponentProps {
    onChanged(snapshot: EditorSnapshot);
    value: any
}

class EditorComponent extends React.Component<EditorComponentProps> {
    editor: any;
    div = React.createRef<HTMLDivElement>();

    componentWillUnmount() {
        this.editor.destroy();
    }

    componentDidMount() {
        this.editor = new JSONEditor(this.div.current, {
            schema,
            startval: this.props.value
        });
        this.editor.on('change', () => {
            let isValid = !(this.editor.validate().length);
            let value = this.editor.getValue();
            this.props.onChanged({
                isValid, value
            })
        })
    }

    render() {
        return <div id={'json-editor-form'} ref={this.div} />
    }
}

export class JsonEditorForm extends React.Component<Props, { snapshot: EditorSnapshot }> {
    state = { snapshot: { isValid: false, value: null } };

    render() {
        return <div>
            <EditorComponent value={this.props.obj} onChanged={this.onChanged} />
            <button disabled={!this.state.snapshot.isValid} className={'btn'} onClick={this.save}>Save</button>
        </div>
    }

    onChanged = (snapshot: EditorSnapshot) => this.setState({ snapshot });

    save = () => {
        this.props.onSave(this.state.snapshot.value);
    }
}
