import { KeyInfo } from '../../domain/statisticsService';
import { KeyboardKey } from './keymap';
import * as React from 'react';

// keyboard size and positioning
const KEY_SIZE = 70;
const KEY_SHIFT = 5;
const KEY_RADIUS = KEY_SIZE / 15;
const SHADOW_SHIFT = 2;
const BORDER_SHIFT = 2;

// color calculation
const step = .15;
const unknownColor = '#ccc';
const stepsColors = [
    '#ffffff',
    '#F2D327',
    // '#DB9E2D',
    // '#F27727',
    '#EB311A'
]


export function Key(props: KeyProps) {
    const { row, col, heat, keybKey } = props;
    const mergedHeat = mergeHeat(heat);
    const color = heat.length
        ? calcColor(mergedHeat.ratio)
        : unknownColor;

    const x1 = row / 2 * KEY_SIZE + col * KEY_SIZE + KEY_SHIFT * col;
    const y1 = row * KEY_SIZE + KEY_SHIFT * row;
    return <>
        <rect x={ x1 + SHADOW_SHIFT + BORDER_SHIFT } y={ y1 + SHADOW_SHIFT + BORDER_SHIFT } width={ KEY_SIZE } height={ KEY_SIZE } stroke={ 'trasnparent' } fill={ '#00000044' }
              ry={ KEY_RADIUS } />
        <rect x={ x1 + BORDER_SHIFT } y={ y1 + BORDER_SHIFT } width={ KEY_SIZE } height={ KEY_SIZE } stroke={ 'black' } fill={ color }
              data-tip={keybKey.chars[0]}
              ry={ KEY_RADIUS } />
        {
            keybKey.chars.length == 1
                ? <text x={ x1 + KEY_SIZE / 2 + BORDER_SHIFT} y={ y1 + KEY_SIZE / 2 + BORDER_SHIFT }
                        style={ { color: 'black', font: 'bold 25px sans-serif' } }>{ keybKey.chars[0] }</text>
                : <>
                    <text x={ x1 + KEY_SIZE / 6 + BORDER_SHIFT } y={ y1 + KEY_SIZE / 2.5 + BORDER_SHIFT}
                          style={ { color: 'black', font: 'bold 25px sans-serif' } }>{ keybKey.chars[0] }</text>
                    <text x={ x1 + KEY_SIZE / 1.6 + BORDER_SHIFT } y={ y1 + KEY_SIZE / 1.3 + BORDER_SHIFT}
                          style={ { color: 'black', font: 'bold 25px sans-serif' } }>{ keybKey.chars[1] }</text>
                </>
        }
        <text x={ x1 + KEY_SIZE / 1.6 + BORDER_SHIFT } y={ y1 + KEY_SIZE / 6 + BORDER_SHIFT }
              style={ { color: 'black', font: '10px sans-serif' } }>{ Math.floor((mergedHeat.ratio || 0) * 100) }%
        </text>
    </>
}


function gradient(color1: string, color2: string, ratio: number) {
    // color1 = color1.substring(1);
    // color2 = color2.substring(1);
    var hex = function (x) {
        x = x.toString(16);
        return (x.length == 1) ? '0' + x : x;
    };

    var r = Math.ceil(parseInt(color1.substring(1, 3), 16) * ratio + parseInt(color2.substring(1, 3), 16) * (1 - ratio));
    var g = Math.ceil(parseInt(color1.substring(3, 5), 16) * ratio + parseInt(color2.substring(3, 5), 16) * (1 - ratio));
    var b = Math.ceil(parseInt(color1.substring(5, 7), 16) * ratio + parseInt(color2.substring(5, 7), 16) * (1 - ratio));

    return '#' + hex(r) + hex(g) + hex(b);
}

function calcColor(fraction: number) {
    for (let i = 1; i < stepsColors.length; i++) {
        let n = step * (i);
        if (fraction < n) {
            return gradient(stepsColors[i - 1], stepsColors[i], (n - fraction) / step);
        }
    }
    return stepsColors[stepsColors.length - 1];
}

interface KeyProps {
    row: number,
    col: number,
    heat: KeyInfo[],
    keybKey: KeyboardKey
}

export function mergeHeat(heat: KeyInfo[]): KeyInfo {
    if (!heat) return heat as any;
    if (heat.length == 1) return heat[0];
    let misstypes = heat.reduce((acc, v) => acc + (v?.misstypes || 0), 0);
    let total = heat.reduce((acc, v) => acc + (v?.total || 0), 0);
    return {
        misstypes,
        total,
        ratio: misstypes / total
    };
}
