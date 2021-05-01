export interface RangeResult {
    index: number,
    length?: number,
    end: number,
    text?: string
}

export function findRanges(text: string, pattern: RegExp) {
    let arr: RegExpExecArray | null;
    let result: RangeResult[] = [];
    while (arr = pattern.exec(text)) {
        result.push({ index: arr.index, length: arr[0].length, text: arr[0], end: arr.index + arr[0].length });
    }
    return result;
}


export function findPatterns(text: string, patterns: string[]) {
    let ranges = patterns
        .map(p => new RegExp(p, 'gm'))
        .map(p => findRanges(text, p))
        .flat()
        .sort((a,b) => a.index - b.index);

    var mergedRanges = mergeRanges(ranges[0], 1, ranges);
    console.log({ranges, mergedRanges});
    return mergedRanges;
}

function mergeRanges(range: RangeResult, nextRangeIdx: number, ranges: RangeResult[]): RangeResult[] {
    const nextRange = ranges[nextRangeIdx];

    // if colliding with next range
    if (nextRange && range.end >= nextRange.index) {
        return mergeRanges({
            index: range.index,
            end: Math.max(nextRange.end, range.end),
        }, nextRangeIdx + 1, ranges);
    }
    // not colliding with next range or next range is missing

    // has next range
    if (nextRange) {
        return [range, ...mergeRanges(nextRange, nextRangeIdx + 1, ranges)];
    }

    // no next range
    return [range];
}
