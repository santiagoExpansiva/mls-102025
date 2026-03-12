/// <mls fileReference="_102025_/l2/collabMessagesInputTag.ts" enhancement="_102027_/l2/enhancementLit" />


import { html, ifDefined } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';

@customElement('collab-messages-input-tag-102025')
export class CollabMessagesInputTag extends StateLitElement {

    @property()
    tags: string[] = [];

    @query('#tag-input')
    input: HTMLInputElement | undefined

    @property({ type: String }) pattern: string | null = null;
    @property({ type: String }) placeholder: string | null = null;


    allowDelete = false;
    @property({ attribute: true, reflect: true }) hasError = false;

    get value() {
        return this.tags.join(',');
    }

    set value(val: string) {
        if (!val) {
            this.empty();
            return;
        }
        const arrTags = val.split(',');
        this.tags = arrTags;
    }

    public onValueChanged: Function | undefined;
    public addTag(tag: string) { return this._addTag(tag); }
    public deleteTag(index: number) { return this._deleteTag(index); }
    public empty() { return this._empty(); }


    private _addTag(tag: string) {
        if (!tag) return;

        if (!this.isValidTag(tag)) {
            this.input?.parentElement?.classList.add('invalid');
            setTimeout(() => this.input?.parentElement?.classList.remove('invalid'), 500);
            this.hasError = true;
            return;
        }

        if (this.tags.indexOf(tag) === -1) {
            this.tags.push(tag);
            if (this.input) this.input.value = '';
            this.requestUpdate();
        } else {
            const element = this.querySelector(`[data-index="${this.tags.indexOf(tag)}"]`) as HTMLElement;
            element.classList.add('duplicate');
            setTimeout(() => element.classList.remove('duplicate'), 500);
            this.hasError = true;
        }
    }


    private _deleteTag(index: number) {
        const newTags: string[] = [];
        this.tags.forEach((tag, idx) => {
            if (idx !== index) {
                newTags.push(tag);
            }
        });
        this.tags = newTags;
        this.requestUpdate();
    }

    private _empty() {
        this.tags = [];
        this.requestUpdate();
    }

    private onInputLeave() {
        if (!this.input) return;
        const { value } = this.input;
        this._addTag(value);
        if (this.onValueChanged) this.onValueChanged(this.value);
    }

    private onInputKeyDown(event: KeyboardEvent) {

        event.stopImmediatePropagation();

        if (!this.input) return;
        const { value } = this.input;
        this.hasError = false;

        if (event.keyCode === 13) {
            this._addTag(value);
            if (this.onValueChanged) this.onValueChanged(this.value);
        } else if (event.keyCode === 188) {
            event.preventDefault();
            this._addTag(value);
            if (this.onValueChanged) this.onValueChanged(this.value);
        } else if (event.keyCode === 8 && value.length === 0) {
            if (this.allowDelete) {
                this._deleteTag(this.tags.length - 1);
                if (this.onValueChanged) this.onValueChanged(this.value);
                this.allowDelete = false;
            } else {
                this.allowDelete = true;
            }
        }

    }

    private isValidTag(tag: string): boolean {
        if (this.pattern) {
            const regex = new RegExp(this.pattern);
            if (!regex.test(tag)) return false;
        }
        return true;
    }

    render() {
        return html
            `<div class="collab-tag-input">
                <input
                    id="tag-input"
                    placeholder=${ifDefined(!this.value ? this.placeholder : undefined)}
                    autocomplete="off"
                    @blur=${this.onInputLeave}
                    @keydown=${(ev: KeyboardEvent) => { this.onInputKeyDown(ev) }}
                ></input>
                ${this.tags.map((tag: string, index: number) => {
                return html`
                    <div data-index=${index} class="tag">
                        ${tag}
                    </div>
                    `
            })}
        </div>`;
    }
}