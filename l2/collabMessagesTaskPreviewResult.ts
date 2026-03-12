/// <mls fileReference="_102025_/l2/collabMessagesTaskPreviewResult.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, repeat } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';  
  
@customElement('collab-messages-task-preview-result-102025')
export class CollabMessageTaskPreviewResult extends CollabLitElement {

    @property({ type: Object }) message: mls.msg.Message | null = null;
    @property({ type: Object }) task: mls.msg.TaskData | null = null;
    @property({ type: Object }) step: mls.msg.AIResultStep | null = null;
    @state() private mode: string = 'result';

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
                            class="tab-button ${this.mode === 'result' ? 'active' : ''}" @click=${() => this.selectTabResult()} >
                            Result                            
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
            case 'result': return this.renderResults();
            case 'info': return this.renderInfo();
            default: return this.renderInfo();
        }

    }


    renderInfo() { 

        if (!this.task || !this.step) return html`Not found!`;

        const aux = this.step.status === 'in_progress' ? '(in progress)' : '';

        return html`
        <div class="containerinputs">
            <details open>
                <summary> ${this.renderSummary('Result' + aux)} </summary>
                <ul>
                    <li>
                        #${this.step.stepId} - ${this.step.type} - ${this.step.status}
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
        <div style="padding:1rem">
            ${this.step.result}
        </div>
        `
    }

    //------IMPLEMENTATION----------

    private selectTabInfo() {
        this.mode = 'info';
    }

    private selectTabResult() {
        this.mode = 'result';
    }

}