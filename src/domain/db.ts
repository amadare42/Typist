import { DBSchema } from 'idb/build/esm/entry';
import { IDBPDatabase, openDB } from 'idb';
import { textsService } from './textsService';

export interface AppDbSchema extends DBSchema {
    keypresses: {
        key: number,
        value: KeyPressDataModel,
        indexes: {
            'by-sequenceId': number
        }
    },
    sequences: {
        key: number,
        value: SeqModel
    },
    texts: {
        key: number,
        value: TextModel,
        indexes: {
            'by-name': string
        }
    }
}

export interface KeyPressDataModel {
    sequenceId: number,
    sequenceNumber: number,

    delay: number,
    expected: string,
    char: string,
    id: number
}

export interface SeqModel {
    id: number,

    startDate: number,
    textId: number,
    textName: string
}

export interface TextModel {
    id: number,
    name: string,
    text: string,
    base: boolean,
    patterns: PatternsModel,
    pageThreshold: number
}

export interface PatternsModel {
    ignorePatterns: string[],
    breakPatterns: string[],
    replacementPatterns:ReplacementPatternModel[]
}

export interface ReplacementPatternModel {
    search: string,
    replace: string
}

export const defaultPatternsModel: PatternsModel = {
    ignorePatterns: [
        "^ {2,}",
        "(?<= ) ",
        "((?<!\\n)\\n(?!\\n))|((?<=\\n)\\n)"
    ],
    replacementPatterns: [
        { search: '(?<!\\n)\\n(?!\\n)', replace: ' \\n' }
    ],
    breakPatterns: [
        '[?!.]'
    ]
}
export const defaultPageThreshold = 300;


export const inputModel = <TModel>(model: Omit<TModel, 'id'>) => model as any;

async function populateBaseData(db: IDBPDatabase<AppDbSchema>) {
    const keys = await db.getAllKeys('texts');
    if (!keys.includes(1)) {
        try {
            let aliceText = await fetch(require('../../data/alice_in_wonderland.txt').default)
                .then(r => r.text());

            await db.put('texts', {
                id: 1,
                name: 'Alice',
                text: aliceText,
                base: true,
                patterns: {
                    ...defaultPatternsModel,
                    ignorePatterns: [...defaultPatternsModel.ignorePatterns, "\\*       "]
                },
                pageThreshold: defaultPageThreshold
            });

            if (!keys.length)
                textsService.setActiveTextId(1);
        } catch (e) {
            console.log('cannot fetch base texts');
        }
    }
}

export const dbPromise = (async function() {
    const db = await openDB<AppDbSchema>('keypresses', 12, {
        async upgrade(db, old, _new, tx) {
            // keypresses
            let pressesStore = db.objectStoreNames.contains('keypresses')
                ? tx.objectStore('keypresses')
                : db.createObjectStore('keypresses', {
                    keyPath: 'id',
                    autoIncrement: true
                });
            if (!pressesStore.indexNames.contains('by-sequenceId')) {
                pressesStore.createIndex('by-sequenceId', 'sequenceId', { unique: false });
            }

            // sequences
            if (!db.objectStoreNames.contains('sequences')) {
                db.createObjectStore('sequences', {
                    keyPath: 'id'
                });
            }

            // texts
            const textStore = db.objectStoreNames.contains('texts')
                ? tx.objectStore('texts')
                : db.createObjectStore('texts', {
                    keyPath: 'id',
                    autoIncrement: true
                });
            if (!textStore.indexNames.contains('by-name')) {
                textStore.createIndex('by-name', 'name', { unique: false });
            }
            let texts = await textStore.getAll();
            texts = texts.map((t: any) => ({ ...t,
                patterns: {
                    ...t.patterns,
                    replacementPatterns: t.patterns.replacementPatterns.map(([search, replace]) => ({ search, replace }))
                }
            }));
            textStore.clear();
            await Promise.all(texts.map(t => textStore.put(t)));
        }
    });

    await populateBaseData(db);
    return db;
})();
