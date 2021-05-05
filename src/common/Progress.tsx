import * as React from 'react';
import * as _ from 'lodash';

interface Props {
    value: number,
    max: number,
    colorOverride?: string
}

export function Progress(props: Props) {
    const { value, max, colorOverride } = props;

    let perc = Math.min(_.floor((value / max * 100)), 100);
    return <div>
        <div style={{ width: '100%', height: '2px', background: '#cccccc88' }} />
        <div style={{ width: `${perc}%`, height: '2px', background: colorOverride || 'green', marginTop: '-2px', transition: 'all', transitionDuration: '100ms'}} />
    </div>
}
