/// <mls fileReference="_102025_/l2/collabMessagesTaskPreviewAgent.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, repeat, unsafeHTML } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';
import { getTemporaryContext } from '/_100554_/l2/aiAgentHelper.js';
import { loadAgent, executeBeforePrompt } from '/_100554_/l2/aiAgentOrchestration.js';

@customElement('collab-messages-task-preview-agent-102025')
export class CollabMessageTaskPreviewAgent extends CollabLitElement {

    @property({ type: Object }) message: mls.msg.Message | null = null;
    @property({ type: Object }) task: mls.msg.TaskData | null = null;
    @property({ type: Object }) step: mls.msg.AIAgentStep | null = null;
    @property({ type: String }) agentDescription: string = '';
    @state() private prompts: mls.msg.IAMessageInputType[] = [];
    @state() private mode: string = 'info';


    private lastKey: number = -1;

    firstUpdated() {

        this.init();

    }

    update(changedProperties: any) {
        super.update(changedProperties);
        this.init();
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
                            class="tab-button ${this.mode === 'input' ? 'active' : ''}" @click=${() => this.selectTabInput()} >
                            Inputs                            
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
            case 'input': return this.renderInputs();
            case 'info': return this.renderInfo();
            case 'result': return this.renderResults();
            default: return this.renderInputs();
        }

    }

    renderInfo() {

        if (!this.task || !this.step) return html`Not found!`;

        let trace = '';
        if (this.step.interaction && Array.isArray(this.step.interaction.trace)) {
            this.step.interaction.trace.forEach((i) => trace += `<p>${i}<p>`)
        } else if (this.step.interaction) {
            trace = this.step.interaction.trace as any;
        }

        const aux = this.step.status === 'in_progress' ? '(in progress)' : '';

        return html`
        <div class="containerinputs">
            <details open>
                <summary> ${this.renderSummary('Agent ' + aux)} </summary>
                <ul>
                    <li>
                        #${this.step.stepId} - ${this.step.agentName} - ${this.step.status} - $${this.step.interaction?.cost}
                    </li>
                    <li>
                        <b>Trace: </b>${unsafeHTML(trace)}
                    </li>
                    <li>
                        <b>${this.step.agentName}: </b>${this.agentDescription}
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
            <details>
                <summary>${this.renderSummary('Advanced details')} </summary>
                <ul>
                    <li>
                        <span>Execute</span>
                        <div style="float: right;">
                            <span>(run again - test)</span>
                            <svg xmlns="http://www.w3.org/2000/svg" style="transform: rotateY(174deg); z-index:9999;width:15px; cursor:pointer" @click=${(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); this.replayForSupport(e.currentTarget as HTMLElement, (this.step as mls.msg.AIAgentStep).agentName, (this.step as mls.msg.AIAgentStep).interaction, (this.step as mls.msg.AIAgentStep).stepId) }} viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M209.4 39.5c-9.1-9.6-24.3-10-33.9-.9L33.8 173.2c-19.9 18.9-19.9 50.7 0 69.6L175.5 377.4c9.6 9.1 24.8 8.7 33.9-.9s8.7-24.8-.9-33.9L66.8 208 208.5 73.4c9.6-9.1 10-24.3 .9-33.9zM352 64c0-12.6-7.4-24.1-19-29.2s-25-3-34.4 5.4l-160 144c-6.7 6.1-10.6 14.7-10.6 23.8s3.9 17.7 10.6 23.8l160 144c9.4 8.5 22.9 10.6 34.4 5.4s19-16.6 19-29.2l0-64 32 0c53 0 96 43 96 96c0 30.4-12.8 47.9-22.2 56.7c-5.5 5.1-9.8 12-9.8 19.5c0 10.9 8.8 19.7 19.7 19.7c2.8 0 5.6-.6 8.1-1.9C494.5 467.9 576 417.3 576 304c0-97.2-78.8-176-176-176l-48 0 0-64z"/></svg>
                            <span class="result"></span>
                        </div>
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

    renderInputs() {

        if (!this.prompts || this.prompts.length === 0)
            return html`
            <div class="containerinputs">
                <h3>No input found!</h3>
            </div>
        `;

        return html`
        <div class="containerinputs containerdraganddrop">
            ${repeat(this.prompts, ((key: mls.msg.IAMessageInputType) => key.type + Date.now()) as any, ((p: mls.msg.IAMessageInputType, idx: number) => { return this.renderPrompt(p, idx) }) as any)}
        </div>
        `
    }

    renderPrompt(prompt: mls.msg.IAMessageInputType, idx: number) {

        let pp = prompt.content.trim();
        return html`
            <details class="prompt ${prompt.type}" >
                <summary>
                    <div class="pheader">
                        <div class="type" style="display:flex; align-items: center;gap:.5rem">
                            <span class="typeMode">${prompt.type}</span>
                            <span class="title">
                                ${pp.substring(0, 50)}...
                            </span>
                        </div>
                        <div style="display:flex; gap:.5rem">
                            <div class="chevron">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="width:10px"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                            </div>
                        </div>
                    </div>
                </summary>
                <div>
                    <pre class="content">${pp}</pre>
                </div>
            </details>
        `;
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
    }//<li @click=${() => this.navigateToStep(ns.stepId)}> [${ns.stepId}] ${ns.type} - ${ns.agentName} </li>



    //------IMPLEMENTATION----------

    private async init() {

        if (this.step && this.step.stepId === this.lastKey) return;
        this.lastKey = this.step?.stepId || -1;
        this.getPrompts();
        await this.getDescription();
    }

    private async getDescription() {

        if (!this.step || !this.step.agentName) return;

        try {
            const agent = await loadAgent(this.step.agentName);
            if (!agent) return;
            if (!agent || !agent.agentDescription) return;
            this.agentDescription = agent.agentDescription;

        } catch (e) {

        }

    }

    private getPrompts() {

        if (this.step && this.step.interaction && this.step.interaction.input) {
            this.prompts = this.step.interaction.input;
        } else {
            this.prompts = [];
        }

    }

    private selectTabInput() {
        this.mode = 'input';
    }

    private selectTabInfo() {
        this.mode = 'info';
    }

    private selectTabResult() {
        this.mode = 'result';
    }

    private async replayForSupport(el: HTMLElement, agentName: string, interaction: any, stepId: number) {

        const sum = el?.closest('div');
        let result: HTMLElement | undefined;
        if (sum) result = sum.querySelector('.result') as HTMLElement;
        if (result) result.innerHTML = '';

        const load = (start: boolean) => {

            if (!el) return;

            if (start) {
                el.classList.remove('fa-reply-all');
                el.classList.add('rotate');
                el.classList.add('fa-rotate-left');
            } else {
                el.classList.remove('fa-rotate-left');
                el.classList.remove('rotate');
                el.classList.add('fa-reply-all');
            }
        };

        try {
            load(true);


            if (!this.task) throw new Error('Not found task');
            const agent = await loadAgent(agentName);
            if (!agent) throw new Error('Not found agent:' + agentName);

            const context = getTemporaryContext(this.task.PK, this.task.owner, 'context temporary');
            context.task = this.task;

            if(agent.replayForSupport) await agent.replayForSupport(context, interaction.payload);
            if (result) result.innerText = 'result: Ok';
            
            load(false);

        } catch (e: any) {
            console.info(e);
            if (result) result.innerText = e && e.message ? 'result: ' + e.message : 'result: Erro';
            load(false);
        }

    }

}