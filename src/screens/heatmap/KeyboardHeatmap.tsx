import * as React from 'react';
import { useCallback, useState } from 'react';
import { KeyInfo, statisctisService, TyposInfo } from '../../domain/statisticsService';
import { lazyKeymap } from './keymap';
import { Dictionary } from 'lodash';
import { Key, mergeHeat, stepsColors } from './Key';
import ReactTooltip from 'react-tooltip';
import { Loading } from '../../common/Loading';

function colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
    var color1 = rgbColor1;
    var color2 = rgbColor2;
    var fade = fadeFraction;

    // Do we have 3 colors for the gradient? Need to adjust the params.
    if (rgbColor3) {
        fade = fade * 2;

        // Find which interval to use and adjust the fade percentage
        if (fade >= 1) {
            fade -= 1;
            color1 = rgbColor2;
            color2 = rgbColor3;
        }
    }

    var diffRed = color2.red - color1.red;
    var diffGreen = color2.green - color1.green;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
        red: parseInt(String(Math.floor(color1.red + (diffRed * fade))), 10),
        green: parseInt(String(Math.floor(color1.green + (diffGreen * fade))), 10),
        blue: parseInt(String(Math.floor(color1.blue + (diffBlue * fade))), 10),
    };

    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
}


export function KeyboardHeatmap() {
    const [map, setMap] = useState<Dictionary<KeyInfo>>(null);
    // const [typos, setTypos] = useState<TyposInfo>(null);

    const getTooltip = useCallback((data: string) => {
        if (!data) return null;
        let key = lazyKeymap().charToKeys[data];
        let heat = mergeHeat(key.chars.map(c => map[c]));
        console.log({ heat });
        return <>
            <span>Key: { key.chars.join('  ')}</span><br/>
            <span>Encountered: { heat.total }</span><br/>
            <span>Typos: { heat.misstypes }</span><br/>
        </>
    }, [map])

    if (!map) {
        statisctisService.getFailmap().then(setMap);
        // statisctisService.getTotalTyposClassification().then(setTypos);
        return <div style={{ width: '80vw', height: '20vh' }}>
            <Loading />
        </div>
    }

    return <>
        <svg viewBox={'0 0 1000 320'} style={{ width: '80vw', minHeight: '30vh' }}>
            <defs>
                <linearGradient id={'grad'}>
                    { stepsColors.map((c, idx) => <stop style={{ stopColor: c, stopOpacity: 1}} key={idx} offset={`${(idx + 1) / c.length * 100}%`}/>) }
                </linearGradient>
            </defs>

            {
                lazyKeymap()
                    .keyboard.map((row, rowIdx) =>
                        row.map((key, colIdx) =>
                            (<Key row={rowIdx} col={colIdx} heat={key.chars.map(c => map[c]).filter(a => a)} key={key.chars[0]} keybKey={key} />))
                    )
                    .flat()
            }
            <rect x="3" y="310" width="996" height="5" fill="url(#grad)" stroke="black"/>
        </svg>
        <ReactTooltip getContent={getTooltip}  />
    </>
}


