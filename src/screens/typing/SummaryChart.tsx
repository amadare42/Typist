import * as React from 'react';
import randomInt from 'random-int';

const min = 0;
const max = 700;

interface Props {
    delays: number[],
    heatmapWidth: number;
}

interface HeatmapInfo {
    start: number;
    end: number;
    stepPrice: number;
    width: number;
}

export function SummaryChart(props: Props) {
    const { delays, heatmapWidth } = props;

    return <svg width={`${heatmapWidth}px`} height={'25px'} viewBox={`0 0 ${heatmapWidth} 25`}>
        { delays.map((d, i) =>
        {
            let x = (heatmapWidth / (max - min)) * (d - min);
            x = x > heatmapWidth - 4 ? heatmapWidth - 4 : x;
            return (<circle key={ i } cy={ 10 + getShift(i) } cx={ x } r={ 4 } aria-valuemax={d} fill={ '#00000011' }/>);
        })}
        <Notches width={heatmapWidth} stepPrice={25} start={min} end={max} />
        {/*<SummaryLine width={heatmapWidth} stepPrice={25} start={min} end={max} delays={delays} />*/}
    </svg>;
}

function Notches({  start, end, stepPrice, width }: HeatmapInfo) {
    let r = [];
    let domainWidth = end - start;

    for (let i = start; i < end; i += stepPrice) {
        let x = (i - start) / domainWidth * width;
        let ym = i % 2 == 0 ? 0 : 5;
        r.push(<line x1={x} x2={x} y1={ym} y2={20 - ym} stroke={'darkgreen'} key={i}/>);
    }

    return <>{r}</>;
}

function SummaryLine({  start, end, stepPrice, width, delays }: HeatmapInfo & {delays: number[]}) {
    let domainWidth = end - start;
    if (!delays.length) return null;

    let stepsCount = Math.ceil(domainWidth / stepPrice);
    let steps = [];
    let min = -1;
    let max = -1

    for (let i = 0; i < stepsCount; i++) {
        let val = delays.filter(d => d > (i * stepsCount) && d < ((i + 1) * stepsCount)).length;
        steps[i] = val;

        if (min == -1 || val < min) {
            min = val
        }
        else if (max == -1 || val > max) {
            max = val;
        }
    }

    let points = steps.map((s, i) => {
        let x = ((i * stepPrice + stepPrice / 2) / domainWidth) * width;
        let y =  25 - ((s - min) / (max - min)) * 25;
        if (i == 0 || i == steps.length - 1) {
            return `${x},25 ${x},${y}`;
        }
        return `${x},${y}`;
    }).join(' ');
    return <polyline points={points} fill={'#33003344'} stroke={'cyan'} />

    // let r = steps.map((s, i) => {
    //     let x = ((i * stepPrice) / domainWidth) * width;
    //     let x2 = x + (stepPrice / domainWidth) * width;
    //     let opacity = s / max;
    //     return (<line x1={ x } y1={23} x2={ x2 } y2={23} strokeWidth={6} key={i} stroke={'black'} opacity={opacity} />);
    // });


    // return <>{r}</>;
}


var shifts = [];
for(var i = 0; i < 300; i++) {
    shifts.push(randomInt(-600, 600) / 100);
}
function getShift(index: number) {
    if (index >= 50) {
        index = index % 50;
    }
    return shifts[index];
}
