export const keymap = `
\` 1! 2@ 3# 4$ 5% 6^ 7& 8* 9( 0) -_ =+
q w e r t y u i o p [{ ]}
a s d f g h j k l ;: '" \\|
z x c v b n m ,< .> /?
`;

export const lazyKeymap = (() => {
    let keyboard: KeyboardMap = null;
    return () => {
        if (keyboard) return keyboard;
        keyboard = parseKeymap(keymap)
        return keyboard;
    }
})();

export function parseKeymap(keymap: string): KeyboardMap {
    let rows = keymap.split('\n').filter(a => a);
    let keyboard = rows.map((row, rowIdx) => {
        const cols = row.split(' ');
        return cols.map((col, colIdx) => {
            return { chars: Array.from(col), row: rowIdx, col: colIdx } as KeyboardKey;
        });
    });
    let charToKeys = Object.fromEntries(
        keyboard.flatMap(row => row
            .flatMap(key => key.chars
                .map(char =>[char, key] as const)
            )
        )
    );
    var map = { keyboard, charToKeys };
    console.log({map});
    return map;
}

export interface KeyboardMap {
    keyboard: KeyboardKey[][];
    charToKeys: { [key: string]: KeyboardKey };
}

export interface KeyboardKey {
    chars: string[],
    row: number,
    col: number
}
