import { dbPromise, inputModel, PatternsModel, TextModel } from './db';
import { BaseDbService } from './baseDbService';

export interface ActiveTextModel {
    id: number,
    text: string,
    position: number,
    patterns: PatternsModel,
    pageThreshold: number
}



class TextsService extends BaseDbService{
    getTexts = async () => {
        return this.doRq(db => db.getAll('texts'))
    }

    async remove(id: number) {
        return this.doRq(db => db.delete('texts', id));
    }

    updateText(text: Omit<TextModel, 'id'> & { id?: number }) {
        return this.doRq(db => db.put('texts', inputModel(text)));
    }

    getActiveTextId() {
        let id = localStorage.getItem('active-text');
        if (!id) {
            return null;
        }
        return parseInt(id);
    }

    setActiveTextId(id: number) {
        localStorage.setItem('active-text', id.toString());
    }

    savePosition(id: number, char: number) {
        const positions: { [key: string]: number } = JSON.parse(localStorage.getItem('saved-positions') || '{}');
        positions[id] = char;
        localStorage.setItem('saved-positions', JSON.stringify(positions))
    }

    getPosition(id: number) {
        const positions: { [key: string]: number } = JSON.parse(localStorage.getItem('saved-positions') || '{}');
        return positions[id] || 0;
    }

    async getActiveText(): Promise<ActiveTextModel> {
        const id = this.getActiveTextId();
        const text = await this.doRq(db => db.get('texts', id));
        if (!text) {
            return null;
        }

        return {
            id,
            text: text.text,
            position: this.getPosition(id),
            patterns: text.patterns,
            pageThreshold: text.pageThreshold
        }
    }

}

export const textsService = new TextsService();
