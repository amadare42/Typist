import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import randomInt from 'random-int';
import { SummaryChart } from './SummaryChart';



interface Props {
    timestamps: number[],
    startedAt: number | undefined,
    completedTime: number | undefined,
    errors: number
}

let global_deviations: number[] = [];
export function Stats(props: Props) {
    const [v, setV] = useState(0);
    const [width, setWidth] = useState(500);
    const divRef = React.useRef<HTMLDivElement>();


    useEffect(() => {
        // componentDidMount
        let handler = () => {
            setV((v) => v + 1);
        };
        const id = setInterval(handler, 900);
        let handleResize = function (e) {
            setWidth(divRef.current.clientWidth);
        };
        window.addEventListener('resize', handleResize)
        setWidth(divRef.current.clientWidth);

        return () => {
            // componentWillUnmount
            clearInterval(id);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        global_deviations = calculateDeviations(props)
    }, [props.timestamps]);

    const { charPerMinute, wpm } = calcWpm(props);
    const delays = calcDelays(props);
    return <>
        <div style={{display: 'flex', justifyContent: 'space-between', background: props.completedTime ? '#33663322' : 'transparent' }} ref={divRef} >
            <span>WPM: { wpm }</span>
            <span>Errors: { props.errors }</span>
            <span>Elapsed: { props.startedAt ? Math.floor(((props.completedTime || Date.now()) - props.startedAt) / 1000) + 's' : 'not started' }</span>
        </div>

        <SummaryChart delays={delays} heatmapWidth={width} />
    </>
}


function calcDelays(props: Props) {
    if (!props.startedAt) return [];

    let result: number[] = [];

    let timestamps = props.timestamps;
    let prev = timestamps[0];
    for (let i = 1; i < timestamps.length; i++) {
        result.push(timestamps[i] - prev);
        prev = timestamps[i];
    }

    return result;
}

function calculateDeviations(props: Props) {
    if (!props.startedAt) return [];
    const { timestamps } = props;

    let avg = calculate(props.timestamps);

    let deviations: number[] = [];
    let prev = timestamps[0];
    let min = -1;
    let max = -1
    for (let i = 1; i < timestamps.length; i++) {
        const delay = timestamps[i] - prev;
        deviations.push(delay);

        if (min == -1 || delay < min) {
            min = delay
        }
        else if (max == -1 || delay > max) {
            max = delay;
        }
    }
    let len = max - min;
    var results = deviations.map(d => ((d - min) / len) * 100);
    return results;
}

function calcWpm(props: Props) {
    if (!props.startedAt) return { charPerMinute: 0, wpm: 0 };
    let elapsed = (props.completedTime || Date.now()) - props.startedAt;
    let timePerChar = elapsed / props.timestamps.length;
    let charPerMinute = Math.floor((60 * 1000) / timePerChar);
    let wpm = Math.floor(charPerMinute / 5);

    return { charPerMinute, wpm };
}

function calculate(timestamps: number[]) {
    if (timestamps.length == 1) {
        return 0;
    }

    let prev = timestamps[0];
    let sum = 0;
    for (let i = 1; i < timestamps.length; i++) {
        sum += timestamps[i] - prev;
        prev = timestamps[i];
    }

    return sum / timestamps.length;
}
