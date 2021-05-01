import * as React from 'react';
import { useCallback, useState } from 'react';
import { KeyInfo, statisctisService } from '../../domain/statisticsService';
import { lazyKeymap } from './keymap';
import { Dictionary } from 'lodash';
import { Key, mergeHeat } from './Key';
import ReactTooltip from 'react-tooltip';

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
    const getTooltip = useCallback((data: string) => {
        if (!data) return null;
        let key = lazyKeymap().charToKeys[data];
        let heatmap = mergeHeat(key.chars.map(c => map[c]));
        return <>
            <span>Key: { key.chars.join('  ')}</span><br/>
            <span>Encountered: { heatmap.total }</span><br/>
            <span>Typos: { heatmap.misstypes }</span><br/>
        </>
    }, [map])

    if (!map) {
        statisctisService.getFailmap().then(setMap);
        return <span>loading...</span>
    }

    return <>
        <svg viewBox={'0 0 1000 320'} style={{ width: '80vw' }}>
            {
                lazyKeymap()
                    .keyboard.map((row, rowIdx) =>
                        row.map((key, colIdx) =>
                            (<Key row={rowIdx} col={colIdx} heat={key.chars.map(c => map[c]).filter(a => a)} key={key.chars[0]} keybKey={key} />))
                    )
                    .flat()
            }
        </svg>
        <ReactTooltip getContent={getTooltip} />
    </>
}


