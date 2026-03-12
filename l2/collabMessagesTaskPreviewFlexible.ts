/// <mls fileReference="_102025_/l2/collabMessagesTaskPreviewFlexible.ts" enhancement="_102027_/l2/enhancementLit" />


import { html, repeat } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';

@customElement('collab-messages-task-preview-flexible-102025')
export class CollabMessageTaskPreviewFlexible extends CollabLitElement {

    @state() private mode: string = 'flexible';
    @property({ type: Object }) message: mls.msg.Message | null = null;
    @property({ type: Object }) task: mls.msg.TaskData | null = null;
    @property({ type: Object }) step: mls.msg.AIFlexibleResultStep | null = null;

    @property({ type: String }) msize = '';
    private editor: IHTMLEditorElement | undefined;
    @query('#elEditor') elEditor: IHTMLEditorElement | undefined;
    private _ed1: monaco.editor.IStandaloneCodeEditor | undefined;
    get confE() { return `l2_left`; }

    async firstUpdated() {
        this.createEditor();

    }

    updated(changedProps: Map<string, any>) {
        if (changedProps.has('step') && this.mode === 'flexible') {
            this.updateEditorContent();
        }
        if (changedProps.has('msize')) {
            this.editor?.setAttribute('msize', this.msize);
        }
    }

    private updateEditorContent() {
        if (!this._ed1 || !this.step) return;

        const value = JSON.stringify(this.step.result, null, 2);
        const model = this._ed1.getModel();
        if (model) {
            model.setValue(value);
        }

    }


    render() {

        if (!this.step) {
            return html`<p>Step not Found.</p>`;
        }

        return html`
            <div style="height: calc(100% - 41px);">
                <div class="tab-header">
                    <div class="tab-group-left">
                        <button
                            class="tab-button ${this.mode === 'info' ? 'active' : ''}" @click=${() => this.selectTabInfo()} >
                            Info                            
                        </button>
                        <button
                            class="tab-button ${this.mode === 'flexible' ? 'active' : ''}" @click=${() => this.selectTabFlexible()} >
                            Flexible                            
                        </button>
                    </div>
                </div>
                <div class="tab-content">
                    ${this.renderMode()}
                    
                </div>
            </div>
        `;
    }

    renderMode() {

        switch (this.mode) {
            case 'flexible': return this.renderFlexible();
            case 'info': return this.renderInfo();
            case 'result': return this.renderResults();
            default: return this.renderInfo();
        }

    }


    renderInfo() {

        if (!this.task || !this.step) return html`Not found!`;
        const aux = this.step.status === 'in_progress' ? '(in progress)' : '';
        return html`
        <div class="containerinputs">
            <details open>
                <summary> ${this.renderSummary('Flexible ' + aux)} </summary>
                <ul>
                    <li>
                        #${this.step.stepId} - ${this.step.type} - ${this.step.status} - $${this.step.interaction ? this.step.interaction.cost : '0'}
                    </li>
                </ul>
            </details>
            <details>
                <summary> ${this.renderSummary('Task details')}</summary>
                <ul>
                    <li>
                        <header>
                                <h2>${this.task.PK}</h2>
                                <small>Status: ${this.task.status} | Última atualização: ${new Date(
            this.task.last_updated
        ).toLocaleString()}</small>
                        <br/><small>${this.task.title}</small>
                        </header>
                    </li>
                </ul>
            </details>
            <details>
                <summary> ${this.renderSummary('Message details')}</summary>
                <ul>
                    <li>
                        <pre>
                            ${JSON.stringify(this.message, null, 2)}
                        </pre>
                    </li>
                </ul>
            </details>
        </div>
        `;
    }

    renderSummary(title: string) {
        return html`
            <div class="pheader">
                <div style="display:flex; align-items: center;gap:.5rem">
                    <span>
                        ${title}
                    </span>
                </div>
                <div style="display:flex; gap:.5rem">
                    <div class="chevron">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="width:10px"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                    </div>
                </div>
            </div>
        `
    }

    renderFlexible() {

        if (!this.step)
            return html`
            <div class="containerinputs">
                <h3>No input found!</h3>
            </div>
        `;

        if (typeof this.step.result === 'object') {

            if (this.step.result.dataUrl) {
                return html`
                <div style="max-width:520px; margin:0 auto; text-align:center;">
                    <figure style="margin:0;">
                        <img
                        src="${this.step.result.dataUrl}"
                        alt="${this.step.result.dataUrl}"
                        style="width:100%; height:auto; display:block; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
                        <figcaption style="margin-top:10px; font-size:14px; color:#555; line-height:1.4;" >
                            ${this.step.result.dataUrl}
                        </figcaption>
                    </figure>
                </div>
                `
            }


        }

        return html`<div id="elEditor" style="width:100%; height:100%"></div>`

    }

    renderResults() {

        if (!this.step) return html`Not found step`;

        const nextOptions: any[] = [];
        if (this.step.interaction?.payload) {
            nextOptions.push(...this.step.interaction.payload);
        }
        if (this.step.nextSteps) {
            nextOptions.push(...this.step.nextSteps);
        }

        return html`
        <ul>
            ${nextOptions.length === 0 ? html`<li><em>Not next step</em></li>`
                : nextOptions.map((ns) => html` <li> [${ns.stepId}] ${ns.type} - ${ns.agentName} </li> `)}
        </ul>
        `
    }

    //------IMPLEMENTATION----------

    private createModel() {
        const uri = monaco.Uri.parse(`file://server/taskViewModel.ts`);
        let src = '';
        let model1 = monaco.editor.getModel(uri);
        if (!model1) model1 = monaco.editor.createModel(src, 'javascript', uri);
        return model1;
    }

    private createEditor(): void {
        if (!this.elEditor || this._ed1) return;
        if ((window as any).editorTaskView) {
            this.editor = (window as any).elEditorTaskView;
            this._ed1 = (window as any).editorTaskView;
            this._ed1?.setModel(this.createModel());

        } else {

            const model = this.createModel();
            (window as any).elEditorTaskView = document.createElement('mls-editor-100529');
            (window as any).elEditorTaskView.style.cssText = 'width:100%; height:100%'
            this.editor = (window as any).elEditorTaskView as IHTMLEditorElement;
            (window as any).editorTaskView = monaco.editor.create(this.editor, this.conf as monaco.editor.IEditorOptions);
            this._ed1 = (window as any).editorTaskView as monaco.editor.IStandaloneCodeEditor;
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                noImplicitAny: true
            });

            this._ed1.updateOptions({ readOnly: true });
            this.editor.mlsEditor = this._ed1;
            this._ed1.setModel(model);
        }

        this.elEditor.appendChild(this.editor as any);
    }


    private selectTabFlexible() {
        this.mode = 'flexible';
    }

    private selectTabInfo() {
        this.mode = 'info';
    }

    private selectTabResult() {
        this.mode = 'result';
    }

    private conf = {
        "contextmenu": true,
        "autoIndent": "full",
        "wordWrap": "on",
        "wrappingIndent": "indent",
        "tabCompletion": "on",
        "renderControlCharacters": false,
        "showUnused": true,
        "glyphMargin": true,
        "minimap": {
            "enabled": false
        },
        "useTabStops": true,
        "scrollBeyondLastColumn": 2,
        "scrollBeyondLastLine": false,
        "formatOnType": true,
        "fixedOverflowWidgets": true,
        "codeLens": true,
        "showFoldingControls": "mouseover",
        "suggestSelection": "first",
        "stickyScroll": {
            "enabled": false,
            "maxLineCount": 3
        },
        "stickyTabStops": true,
        "fontSize": 14,
        "automaticLayout": true,
    }

}

interface IHTMLEditorElement extends HTMLElement {
    mlsEditor: monaco.editor.IStandaloneCodeEditor
}