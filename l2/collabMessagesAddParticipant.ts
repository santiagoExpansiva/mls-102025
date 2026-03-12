/// <mls fileReference="_102025_/l2/collabMessagesAddParticipant.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { updateThread, updateUsers } from '/_102025_/l2/collabMessagesIndexedDB.js';
import { notifyThreadChange } from '/_100554_/l2/aiAgentHelper.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    btnAddParticipant: 'Adicionar participante',
    labelUserId: 'Nome do usuario ou Id',
    labelPermission: 'Autoridade:',
    errorFieldsAddParticipant: 'Preencha todos os campos!',
    successAddParticipant: 'Usuário adicionado com sucesso',
    threadDetails: 'Detalhes da sala'
}

const message_en = {
    loading: 'Loading...',
    btnAddParticipant: 'Add Participant',
    labelUserId: 'User id or name',
    labelPermission: 'Auth:',
    errorFieldsAddParticipant: 'Fill in all fields!',
    successAddParticipant: 'User added sucessfully',
    threadDetails: 'Thread details'
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-add-participant-102025')
export class CollabMessagesAddParticipant extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property() userId: string | undefined;
    @property() labelOkAddParticipant: string = '';
    @property() labelErrorAddParticipant: string = '';
    @property() userIdOrName = '';
    @property() auth: mls.msg.UserAuth = 'write';
    @property() isAddParticipant: boolean = false;
    @property() actualThread: IThreadActual | undefined;

    @property() highlightedIndex: number = -1;
    @state() suggestions: string[] = [];
    @state() allUsers: string[] = [];
    @state() private users: {
        userId: string;
        name: string;
    }[] = [];

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        await this.loadUsersAvaliables();
    }

    render() {
        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];

        return html`
        <div class="add-participant">
            <label style="position: relative;">
                ${this.msg.labelUserId}
                <input 
                    name="add participant"
                    autocomplete="off"
                    type="text"
                    .value=${this.userIdOrName}
                     @input=${this.onInput}
                     @blur=${this.onBlur}
                     @focus=${this.onFocus}
                     @keydown=${this.onKeyDown}
                />
                ${this.suggestions.length > 0
                ? html`
                        <div class="suggestions">
                        ${this.suggestions.map(
                    (item, index) => html`
                            <div
                                class="suggestion ${index === this.highlightedIndex ? 'highlighted' : ''}"
                                @click=${() => this.selectSuggestion(item)}
                            >
                                ${item}
                            </div>
                            `
                )}
                        </div>
                    `
                : null}
            </label>

            

            <label>
                ${this.msg.labelPermission}
                <select
                    .value=${this.auth}
                    @change=${(e: Event) => (this.auth as string) = (e.target as HTMLSelectElement).value}
                >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="none">None</option>
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                </select>
            </label>

            <button
                @click=${this.onSubmitAddParticipant}
                ?disabled=${this.isAddParticipant}
            >
                ${this.isAddParticipant ? html`<span class="loader"></span>` : this.msg.btnAddParticipant}
            </button>
            
            ${this.labelOkAddParticipant ? html`<small class="add-participant-ok">${this.labelOkAddParticipant}<small>` : ''}
            ${this.labelErrorAddParticipant ? html`<small class="add-participant-error">${this.labelErrorAddParticipant}<small>` : ''}
        </div>
    `;
    }

    private onInput(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        this.userIdOrName = value;
        if (!value.trim()) {
            this.suggestions = [];
            return;
        }

        this.suggestions = this.allUsers.filter((name) =>
            name.toLowerCase().includes(value.toLowerCase())
        );
    }

    private onBlur() {
        setTimeout(() => {
            this.suggestions = [];
        }, 200);
    }

    private selectSuggestion(suggestion: string) {
        this.userIdOrName = suggestion;
        this.suggestions = [];
    }

    private onKeyDown(e: KeyboardEvent) {
        if (this.suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.highlightedIndex = (this.highlightedIndex + 1) % this.suggestions.length;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.highlightedIndex =
                (this.highlightedIndex - 1 + this.suggestions.length) % this.suggestions.length;
        }

        if (e.key === 'Tab' || e.key === 'Enter') {
            if (this.highlightedIndex >= 0 && this.highlightedIndex < this.suggestions.length) {
                e.preventDefault(); // previne foco mudar com Tab
                this.selectSuggestion(this.suggestions[this.highlightedIndex]);
            }
        }
    }



    private onFocus() {
        if (this.userIdOrName) {
            this.suggestions = this.allUsers.filter((name) =>
                name.toLowerCase().includes(this.userIdOrName.toLowerCase())
            );
        }
    }


    private async onSubmitAddParticipant() {

        this.labelErrorAddParticipant = '';
        this.labelOkAddParticipant = '';

        if (!this.actualThread || !this.userId) {
            return;
        }
        if (!this.userIdOrName || !this.auth) {
            this.labelErrorAddParticipant = this.msg.errorFieldsAddParticipant
            return;
        }

        this.isAddParticipant = true;

        try {
            const response = await mls.api.msgAddUserInThread({
                auth: this.auth,
                userIdOrName: this.userIdOrName.trim(),
                threadId: this.actualThread?.thread.threadId,
                userId: this.userId,
            });

            if (response.statusCode !== 200) {
                this.labelErrorAddParticipant = `${response.msg}`;
                this.isAddParticipant = false;
                return;
            }

            if (response.thread) {
                const thr = await updateThread(response.thread.threadId, response.thread);
                const thrUpdt = await mls.api.msgGetThreadUpdate({
                    threadId: response.thread.threadId,
                    userId: this.userId,
                    lastOrderAt: thr.lastSync || new Date('2000-01-01').toISOString(),
                });
                if (thrUpdt && thrUpdt.users) await updateUsers(thrUpdt.users);
                notifyThreadChange(thrUpdt.thread);

                this.dispatchEvent(new CustomEvent('add-participant', {
                    detail: {
                        thread: thr,
                    },
                    bubbles: true,
                    composed: true
                }));
            }


            this.labelOkAddParticipant = `${this.msg.successAddParticipant}`;
            setTimeout(() => {
                this.labelOkAddParticipant = '';
            }, 3000);
            this.userIdOrName = '';
            this.auth = 'write';
            this.isAddParticipant = false;

        } catch (error: any) {
            console.error('Error on add user:', error);
            this.labelErrorAddParticipant = error.message;
            this.isAddParticipant = false;
        }
    }

    private async loadUsersAvaliables() {
        if (!this.userId) return;
        const res = await mls.api.msgGetUsers({ status: "active", prefixName: "", userId: this.userId });
        if (res.statusCode !== 200) return;
        this.users = res.users;
        this.allUsers = this.users.map((usr) => usr.name);
    }

}

interface IThreadActual {
    thread: mls.msg.ThreadPerformanceCache,
    users: mls.msg.User[]
}
