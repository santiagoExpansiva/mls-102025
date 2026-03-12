/// <mls fileReference="_102025_/l2/collabMessagesThreadModal.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { getDateFormated } from '/_100554_/l2/libCommom.js';
import { formatTimestamp } from '/_100554_/l2/aiAgentHelper.js';
import { collab_clock_static, collab_users } from '/_102025_/l2/collabMessagesIcons.js';
import '/_102025_/l2/collabMessagesAvatar.js';

/// **collab_i18n_start**
const message_pt = {
    loading: 'Carregando...',
    userInThread: 'pessoas nesse canal',
    seeChannel: 'Ver canal',
}

const message_en = {
    loading: 'Loading...',
    userInThread: ' people in this channel',
    seeChannel: 'See channel',
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-thread-modal-102025')
export class CollabMessagesThreadModal extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property({ type: Boolean }) open = true;
    @property() thread?: mls.msg.ThreadPerformanceCache;

    @state() private isLoading: boolean = false;
    @state() private errorMessage: string = '';

    private handleGlobalMouseMove = (e: MouseEvent) => {
        const modal = this.querySelector('collab-messages-thread-modal-102025');
        if (modal && !modal.contains(e.target as Node)) {
            this.destroy();
        }
    };

    firstUpdated(_changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(_changedProperties);
        document.addEventListener('mousemove', this.handleGlobalMouseMove);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
    }

    private destroy() {
        this.remove();
    }

    render() {

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        if (!this.open) return null;

        return html`
        <div class="collab-messages-thread-modal-box"
            @mouseover=${(e: MouseEvent) => e.stopPropagation()}
            @mouseleave=${(e: MouseEvent) => { e.stopPropagation(); this.destroy(); }}
            @click=${(e: Event) => e.stopPropagation()}
        >
            <div class="collab-messages-thread-modal-header">
            <collab-messages-avatar-102025 avatar=${this.thread?.avatar_url} alt=${this.thread?.name} ></collab-messages-avatar-102025>
                <div>
                    <div class="collab-messages-thread-modal-title">${this.thread?.name}</div>
                    <div class="collab-messages-thread-modal-subtitle">${collab_users}${this.thread?.users.length || '0'} ${this.msg.userInThread}</div>
                    <div class="collab-messages-thread-modal-subtitle">${collab_clock_static} ${getDateFormated(formatTimestamp(this.thread?.lastMessageTime || '')?.dateFull || '')}</div>
                    <div class="collab-messages-thread-modal-userStatus ${this.thread?.status}"> ● ${this.thread?.status}</div>
                </div>
            </div>

            ${this.errorMessage ? html`<small class="user-message-error">${this.errorMessage}<small>` : ''}

      
            <div class="collab-messages-thread-modal-actions">
                <button
                    @click=${this.onClickThreadAction} 
                    class="collab-messages-thread-modal-message-btn"
                    ?disabled=${this.isLoading}
                >
                    ${this.isLoading ? html`<span class="loader"></span>` : html`${this.msg.seeChannel}`}
                </button>
            </div>
            
        
        </div>
    
    `;
    }

    private async onClickThreadAction() {

        if (!this.thread) return;
        this.isLoading = true;
        try {
            await mls.events.fire([mls.actualLevel], 'collabMessages' as any, JSON.stringify({ threadId: this.thread?.threadId, type: 'thread-open' }));
        } catch (err: any) {
            this.errorMessage = err.message;
        } finally {
            this.isLoading = false;
        };


    }

}