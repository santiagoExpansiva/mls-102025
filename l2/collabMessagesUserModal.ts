/// <mls fileReference="_102025_/l2/collabMessagesUserModal.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { collab_message } from '/_102025_/l2/collabMessagesIcons.js';
import { createThreadDM, getDmThreadByUsers } from '/_102025_/l2/collabMessagesHelper.js';

/// **collab_i18n_start**
const message_pt = {
    loading: 'Carregando...',
    message: 'Mensagem',
}

const message_en = {
    loading: 'Loading...',
    message: 'Message',

}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-user-modal-102025')
export class CollabMessagesUserModal extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property({ type: Boolean }) open = true;
    @property() user?: mls.msg.User;
    @property() actualUserId?: string;

    @state() private isLoading: boolean = false;
    @state() private errorMessage: string = '';

    private close() {
        this.open = false;
    }

    private handleGlobalMouseMove = (e: MouseEvent) => {
        const modal = this.querySelector('collab-messages-user-modal-102025');
        if (modal && !modal.contains(e.target as Node)) {
            this.destroy();
        }
    };

    firstUpdated() {
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
        <div class="collab-messages-user-modal-box"
            @mouseover=${(e: MouseEvent) => e.stopPropagation()}
            @mouseleave=${(e: MouseEvent) => { e.stopPropagation(); this.destroy(); }}
            @click=${(e: Event) => e.stopPropagation()}
        >
            <div class="collab-messages-user-modal-header">
            <img class="collab-messages-user-modal-avatar" src=${this.user?.avatar_url} alt=${this.user?.name} />
                <div>
                    <div class="collab-messages-user-modal-userName">${this.user?.name}<span class="collab-messages-user-modal-userId"> (${this.user?.userId})</span></div>
                    <div class="collab-messages-user-modal-userStatus ${this.user?.status}"> ● ${this.user?.status}</div>
                </div>
            </div>

            ${this.errorMessage ? html`<small class="user-message-error">${this.errorMessage}<small>` : ''}

            ${this.actualUserId !== this.user?.userId ?
                html`    
                <div class="collab-messages-user-modal-actions">
                    <button
                        @click=${this.onClickUserAction} 
                        class="collab-messages-user-modal-message-btn"
                        ?disabled=${this.isLoading}
                    >
                        ${this.isLoading ? html`<span class="loader"></span>` : html`${collab_message} ${this.msg.message}`}
                    </button>
                </div>`: ''
            }
        
        </div>
    
    `;
    }

    private async onClickUserAction() {

        if (!this.actualUserId || !this.user) return;
        this.isLoading = true;
        try {
            let thread = await getDmThreadByUsers(this.actualUserId, this.user.userId);
            if (!thread) {
                const threadName = `@${this.user.name}`;
                thread = await createThreadDM(threadName, this.user.userId, 'CONNECT');
            }
            this.destroy();
            await mls.events.fire([mls.actualLevel], 'collabMessages' as any, JSON.stringify({ threadId: thread?.threadId, type: 'thread-open' }));
        } catch (err: any) {
            this.errorMessage = err.message;
        } finally {
            this.isLoading = false;
        };


    }

}