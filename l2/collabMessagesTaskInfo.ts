/// <mls fileReference="_102025_/l2/collabMessagesTaskInfo.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { getClarification, getClarificationElement, continuePoolingTask } from '/_100554_/l2/aiAgentOrchestration.js';
import { getNextPendentStep, getNextClarificationStep, getInteractionStepId, getStepById } from '/_100554_/l2/aiAgentHelper.js';

import '/_102025_/l2/collabMessagesTaskDetails.js';
import '/_102025_/l2/collabMessagesTaskPreview.js';
import '/_102025_/l2/collabMessagesTaskLogPreview.js';

@customElement('collab-messages-task-info-102025')
export class CollabMessagesTaskInfo extends StateLitElement {

    private elParent: HTMLElement | undefined;
    private forceViewRaw = false;
    private hasTodo = true;

    @property() task: mls.msg.TaskData | undefined = undefined;
    @property() message: mls.msg.Message | undefined = undefined;
    @property() restartPooling: boolean = false;
    @property() isTest: boolean = false;

    @property() stepid: string = '';
    @property({ attribute: false }) seen = new Set<string>();

    @property() interactionClarification: mls.msg.AIAgentStep | undefined;
    @query('.direct-clarification') directClarification: HTMLElement | undefined;
    @query('.direct-clarification .content') directClarificationContent: HTMLElement | undefined;

    @state() private activeTab: 'workflow' | 'step' | 'raw' | 'todo' = 'todo';
    @state() isClarificationPending = false;

    connectedCallback() {
        super.connectedCallback();
        this.elParent = this.closest('collab-messages-chat-102025') as HTMLElement;
        if (this.elParent) this.elParent.style.width = '100%';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.elParent) this.elParent.style.width = '';
        window.removeEventListener('task-change', this.onTaskChange.bind(this));

    }

    async updated(changedProperties: Map<PropertyKey, unknown>) {
        if (changedProperties.has('isClarificationPending') && this.isClarificationPending) {
            this.setClarification();
        }
    }

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        window.addEventListener('task-change', this.onTaskChange.bind(this));
        if (this.interactionClarification) {
            this.setClarification();
        }
        if (this.restartPooling && this.message && this.task) {
            const context: mls.msg.ExecutionContext = {
                task: this.task,
                message: this.message,
                isTest: this.isTest || false
            }
            continuePoolingTask(context);
        }
    }

    render() {

        if (!this.task) return html`No task.`;

        this.isClarificationPending = false;
        if (this.task) {
            const nextStepPending = getNextPendentStep(this.task);
            if (nextStepPending?.type === 'clarification') this.isClarificationPending = true;
        }

        if (this.isClarificationPending && !this.forceViewRaw) return this.renderDirectClarification();

        return this.renderTab();
    }

    renderTab() {

        let aux: any = '';

        if (this.hasTodo) {
            aux = html`
            <div class="tab ${this.activeTab === 'todo' ? 'active' : ''}" @click=${() => this.setTab('todo')} >Todo</div>`;
        }
        return html`
            ${this.isClarificationPending ? html`<button class="viewraw" @click=${() => this.clickForceViewRaw(false)}>Clarification</button>` : ''}
            <div style="height: calc(100% - 3rem);">
                <div class="tabs">
                    ${aux}
                    <div
                        class="tab ${this.activeTab === 'step' ? 'active' : ''}"
                        @click=${() => this.setTab('step')}
                    >Step</div>
                    <div
                        class="tab ${this.activeTab === 'raw' ? 'active' : ''}"
                        @click=${() => this.setTab('raw')}
                    >Raw</div>
                    <div
                        class="tab ${this.activeTab === 'workflow' ? 'active' : ''}"
                        @click=${() => this.setTab('workflow')}
                    >Workflow</div>

                </div>
                <div class="content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;


    }

    renderTabContent() {
        switch (this.activeTab) {
            case 'workflow': return html`workflow`;
            case 'step': return this.renderStep();
            case 'raw': return this.renderRaw();
            case 'todo': return this.renderTodo();
            default: return html`workflow`;
        }
    }

    renderRaw() {
        return html`<collab-messages-task-details-102025 .task=${this.task} taskId=${this.task?.PK}></collab-messages-task-details-102025>`
    }

    renderStep() {
        return html`<collab-messages-task-preview-102025 .message=${this.message} .task=${this.task}></collab-messages-task-preview-102025>`
    }

    renderTodo() {
        return html`<collab-messages-task-log-preview-102025 .message=${this.message} .task=${this.task}></collab-messages-task-log-preview-102025>`
    }

    renderDirectClarification() {

        if (!this.task) throw new Error('Invalid task');
        const payload = getNextClarificationStep(this.task);
        if (!payload) return html``;
        return html`
        <button class="viewraw" @click=${() => this.clickForceViewRaw(true)}>View raw</button>
        <div class="direct-clarification">${this.renderClarification(payload)}
        </div>`
    }

    renderClarification(payload: mls.msg.AIClarificationStep) {

        if (!this.task) return html`Invalid task`;
        const parentInteraction = getInteractionStepId(this.task, payload.stepId);
        if (!parentInteraction) return html`No found parentInteraction ${payload.stepId} on task: ${this.task.PK} `;
        const interaction = getStepById(this.task, parentInteraction) as mls.msg.AIAgentStep;
        this.interactionClarification = interaction;
        if (!interaction) return html`Invalid interaction id:${parentInteraction} on task: ${this.task.PK} `
        if (!interaction.agentName) return html`Invalid agent name for step id:${interaction.stepId} on task: ${this.task.PK} `
        return html`<div class="content"> Processing...</div>`

    }

    //---------IMPLEMENTATION -----------

    private clickForceViewRaw(force: boolean) {
        this.forceViewRaw = force;
        this.requestUpdate();
        if (!force) setTimeout(() => this.setClarification(), 300);
    }

    private async setClarification(): Promise<void> {
        if (!this.directClarificationContent || !this.task || !this.message) return;
        let clarification: HTMLElement | null = null;
        if (this.task.iaCompressed?.queueFrontEnd) {
            try {
                clarification = await getClarificationElement({ message: this.message, task: this.task, isTest: false });
            } catch {
                return;
            }

        } else clarification = await getClarification(this.task.PK);

        if (!clarification) return;
        this.directClarificationContent.innerHTML = '';
        this.directClarificationContent.appendChild(clarification);
        this.executeHTMLClarificationScript();
    }

    private executeHTMLClarificationScript() {
        this.directClarification?.querySelectorAll('script').forEach(oldScript => {

            const newScript = document.createElement('script');
            newScript.type = oldScript.type || 'text/javascript';
            if (!newScript.type) {
                newScript.type = 'text/javascript';
            }

            if (oldScript.hasAttribute('type') && oldScript.getAttribute('type') === 'module') {
                newScript.type = 'module';
            }

            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });
    }


    private setTab(tab: 'workflow' | 'step' | 'raw' | 'todo') {
        this.activeTab = tab;
    }

    private onTaskChange(e: Event) {
        if (!this.task) return;
        const customEvent = e as CustomEvent;
        const task: mls.msg.TaskData = customEvent.detail.context.task;
        if (task.PK !== this.task.PK) return;
        this.task = task;
    }

}