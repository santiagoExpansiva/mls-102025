/// <mls fileReference="_102025_/l2/collabMessagesTask.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { getNextPendentStep, getTotalCost } from '/_100554_/l2/aiAgentHelper.js';
import { executeNextStep } from "/_100554_/l2/aiAgentOrchestration.js";
import { getTask, getMessage } from '/_102025_/l2/collabMessagesIndexedDB.js';

import {
    collab_money,
    collab_pause,
    collab_bell,
    collab_chevron_right,
    collab_clock,
    collab_check,
    collab_bug,
    collab_play
} from '/_102025_/l2/collabMessagesIcons.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
}

const message_en = {
    loading: 'Loading...',
}
type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-task-102025')
export class CollabMessagesTask extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property() taskid: string = '';
    @property() threadId: string = '';
    @property() userId: string = '';
    @property() messageid: string = '';
    @property() lastChanged: string = '';
    @property() status: string = '';

    @state() task: mls.msg.TaskData | undefined;
    @state() context: mls.msg.ExecutionContext | undefined;
    @state() private secondsPassed: number = 0;
    @state() private lastStep: number | undefined;
    @state() continueEnabled: boolean = false;
    
    private timerId: number | undefined;

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = undefined;
        }
    }

    async updated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);

        if (changedProperties.has('lastChanged')) {
            if (this.context && this.context.task) {
                this.task = this.context.task;
                const nextStep = getNextPendentStep(this.task);
                if (!nextStep || nextStep.type === 'clarification') {
                    this.resetTimer();
                    this.lastStep = undefined;
                } else {
                    if (this.lastStep !== nextStep.stepId) {
                        this.resetTimer();
                        this.lastStep = nextStep.stepId
                    }
                }
            }
        }

        if (changedProperties.has('taskid') && changedProperties.get('taskid') !== '') {
            this.getTaskLocal(this.taskid);
        }
    }

    render() {

        const isOverMinute = this.secondsPassed >= 60;
        const timeClass = isOverMinute ? 'card-time over-minute' : 'card-time';

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        if (!this.task) {
            return html`<div @click=${this.onCardClick} class="card no-details"> 
            <div class="card-header">
                <span class="card-title">Task</span>
                ${collab_chevron_right}
            </div>
         </div>`
        }

        const price = this.task ? getTotalCost(this.task) || '0.00' : '';
        const title = this.task?.title || '';
        const timeDisplay = this.formatTime(this.secondsPassed);

        return html`<div @click=${this.onCardClick} class="card"> 
        <div class="card-header">
            ${this.renderIconTask()}
            <span class="card-title"> ${title}</span>
            <span class="card-price"> ${price ? collab_money : ''}${price}</span>
            ${this.lastStep ? html`<span class="${timeClass}">${timeDisplay}</span>` : ''}
        </div>
     </div>`;
    }

    renderIconTask() {

        if (this.continueEnabled) {
            return html`<span @click=${this.onContinueClick} class="task-icon">${collab_play}</span>`;
        }

        const taskObj: any = {
            '': html``,
            'pending': collab_clock,
            'paused': collab_pause,
            'todo': collab_clock,
            'in progress': collab_clock,
            'done': collab_check,
            'failed': collab_bug,
            'waitingforuser': html`
                    <span class="icon-wrapper">
                        ${collab_bell}
                        <span class="notification-badge">1</span>
                    </span>`,
        }
        let status = this.status;
        if (this.task) {
            status = this.task.status;
            const nextStepPending = getNextPendentStep(this.task);
            if (nextStepPending?.type === 'clarification') status = 'waitingforuser'
        }

        if (!status) return html`<span class="task-icon in progress ">${collab_clock}</span>`;
        return html`<span class="task-icon ${status.split(' ').join('-')} ">${taskObj[status]}</span>`;

    }

    private onContinueClick(e: MouseEvent) {

        e.stopPropagation();
        if (this.context) {
            executeNextStep(this.context);
            this.continueEnabled = false;
            this.resetTimer();
        }
    }

    private resetTimer() {
        if (this.continueEnabled) return;
        this.secondsPassed = 0;
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        this.timerId = window.setInterval(() => {
            this.secondsPassed++;
            this.requestUpdate();
        }, 1000);
    }

    private formatTime(seconds: number) {
        const min = Math.floor(seconds / 60).toString().padStart(2, '0');
        const sec = (seconds % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    }

    private async getTaskLocal(taskId: string) {
        const task = await getTask(taskId);
        if (task) {
            this.task = task;

            if (task.status === 'in progress' && task.owner === this.userId && !this.context) {
                const messageId = `${this.threadId}/${this.messageid}`

                const response = await mls.api.msgGetTaskUpdate({
                    messageId,
                    taskId,
                    userId: this.userId
                });

                const message = await getMessage(messageId);
                if (!message) return;
                if (!response || response.statusCode !== 200) return;

                this.context = {
                    task: response.task,
                    message,
                    isTest: false
                }

                this.lastChanged = new Date().getTime().toString();
                const nextPendent = getNextPendentStep(response.task);
                if (nextPendent && nextPendent.type !== 'clarification') {
                    this.continueEnabled = true;
                }
            }

        }
    }

    private onCardClick() {
        const event = new CustomEvent('taskclick', {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

}
