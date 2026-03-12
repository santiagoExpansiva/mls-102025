/// <mls fileReference="_102025_/l2/collabMessagesFindtask.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { ServiceBase } from '/_100554_/l2/serviceBase.js';
import { getUserId } from "/_102025_/l2/collabMessagesHelper.js";

import '/_102025_/l2/collabMessagesTaskDetails.js';


/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    find: 'Buscar',
}

const message_en = {
    loading: 'Loading...',
    find: 'Search',
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-findtask-102025')
export class CollabMessagesFindTask extends StateLitElement {

    private msg: MessageType = messages['en'];
    private serviceBase: ServiceBase | undefined;

    @state() threadId?: string;
    @state() taskId?: string;

    @property() actualTask: mls.msg.TaskData | undefined;
    @property() isLoading: boolean = false;

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);
    }


    render() {

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        return html`
            ${this.renderSearch()}
        `;
    }

    private renderSearch() {


        return html`
            <div class="section">
                <div>
                    <label class="title">MessageId</label>
                    <input
                        type="text"
                        @input=${(e: MouseEvent) => this.handleThreadChange(e)}
                    /input>
                </div>
                <div>
                    <label class="title">TaskId</label>
                    <input
                        type="text"
                        @input=${(e: MouseEvent) => this.handleTaskChange(e)}
                    /input>
                </div>
                <div>
                <button
                    @click=${this.findThread}
                    ?disabled=${this.isLoading}
                >
                    ${this.isLoading ? html`<span class="loader"></span>` : this.msg.find}
                </button>
            </div>
            </div>
            

            <collab-messages-task-details-102025 .task=${this.actualTask} taskId=${this.actualTask?.PK}></collab-messages-task-details-102025>
        
        `
    }

    private handleThreadChange(e: MouseEvent) {
        const target = e.target as HTMLTextAreaElement;
        this.threadId = target.value.trim();
    }

    private handleTaskChange(e: MouseEvent) {
        const target = e.target as HTMLTextAreaElement;
        this.taskId = target.value.trim();
    }

    private async findThread() {
        this.isLoading = true;
        try {
            const user = getUserId();
            if (!this.taskId || !this.threadId || !user) return;
            const rc = await mls.api.msgGetTaskUpdate({
                messageId: this.threadId,
                taskId: this.taskId,
                userId: user
            });
            this.actualTask = rc.task;
        } catch (err: any) {
            this.actualTask = undefined;
            this.serviceBase?.setError(err.message)
        } finally {
            this.isLoading = false;
        }

    }

}

