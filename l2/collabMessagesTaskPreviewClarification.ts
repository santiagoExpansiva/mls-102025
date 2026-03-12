/// <mls fileReference="_102025_/l2/collabMessagesTaskPreviewClarification.ts" enhancement="_102027_/l2/enhancementLit" />


import { html, unsafeHTML } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js'; 
import { getStepById, getTemporaryContext } from "/_100554_/l2/aiAgentHelper.js";
import { loadAgent, executeBeforePrompt } from '/_100554_/l2/aiAgentOrchestration.js';

@customElement('collab-messages-task-preview-clarification-102025')   
export class CollabMessageTaskPreviewClarification extends CollabLitElement { 

    @property({ type: Object }) message: mls.msg.Message | null = null;
    @property({ type: Object }) task: mls.msg.TaskData | null = null;
    @property({ type: Object }) step: mls.msg.AIClarificationStep | null = null;
    @state() private mode: string = 'info';
    @state() private tag: string = 'pre';
    @query('#clarificationid') clarificationid: HTMLDivElement | undefined;
    private elClarification: HTMLDivElement | null = null;

    firstUpdated() {
        this.getFile();
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
                            class="tab-button ${this.mode === 'clarification' ? 'active' : ''}" @click=${() => this.selectTabClarification()} >
                            Clarification                            
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
            case 'clarification': return this.renderClarification();
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
                <summary> ${this.renderSummary('Clarification '+ aux)} </summary>
                <ul>
                    <li>
                        #${this.step.stepId} - ${this.step.type} - ${this.step.status} - $${this.step.interaction? this.step.interaction.cost : '0'}
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

    renderClarification() {

        if (!this.step || !this.elClarification)
            return html`
            <div class="containerinputs">
                <h3>No input found!</h3>
            </div>
        `;

        setTimeout(() => {

            if (!this.clarificationid || !this.elClarification) {
                if(this.clarificationid) this.clarificationid.innerHTML = '';
                return;
            }
            this.clarificationid.appendChild(this.elClarification)

            /*if (!this.clarificationid || !this.step || !this.task) return;
            const dt = {
                clarificationMessage: '',
                stepId: this.step.stepId,
                taskId: this.task.PK,
                json: this.step.json
            };

            (this.clarificationid as any).data = dt;
            this.clarificationid.setAttribute('mode', 'readonly');*/

            
        }, 300)


        return unsafeHTML(`
            <${this.tag} id="clarificationid">
            </${this.tag}>
        `)
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


    private selectTabClarification() {
        this.mode = 'clarification';
    }

    private selectTabInfo() {
        this.mode = 'info';
    }

    private async getFile() {

        if (!this.step || !this.task ) return;
        const agentName = this.getAgentBeforeStep(this.step.stepId);
        if (!agentName) return;
        const agent = await loadAgent(agentName);
        if (!agent) return;
        const ctx = getTemporaryContext('11111', this.task.owner, '');
        ctx.task = this.task;
        this.elClarification = agent.beforeClarification ? await agent.beforeClarification(ctx, this.step.stepId, true) : null;
        if (this.elClarification) this.tag = 'div';

    }

    private getAgentBeforeStep(stepId: number): string {

        if (!this.task) return '';

        const agent = getStepById(this.task, stepId);
        if (agent && agent.type === 'agent') return agent.agentName;

        const next = stepId - 1;
        if (stepId > 0) return this.getAgentBeforeStep(stepId - 1)

        return '';

    }
}