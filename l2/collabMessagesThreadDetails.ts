/// <mls fileReference="_102025_/l2/collabMessagesThreadDetails.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, repeat, ifDefined } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import { updateThread, getUser, deleteAllMessagesFromThread } from '/_102025_/l2/collabMessagesIndexedDB.js';
import { collab_triangle_exclamation } from '/_102025_/l2/collabMessagesIcons.js';
import { notifyThreadChange } from '/_100554_/l2/aiAgentHelper.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { addMessage } from "/_102025_/l2/collabMessagesHelper.js";

import '/_102025_/l2/collabMessagesInputTag.js';
import '/_102025_/l2/collabMessagesAddParticipant.js';
import '/_102025_/l2/collabMessagesChangeAvatar.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    threadName: 'Nome da thread',
    visibility: 'Visibilidade',
    visibilityPublic: 'Pública',
    visibilityPrivate: 'Privada',
    visibilityCompany: 'Empresa',
    visibilityTeam: 'Time',
    status: 'Status',
    statusActive: 'Ativo',
    statusArchived: 'Arquivado',
    statusDeleted: 'Deletado',
    statusDeleting: 'Deletando',
    topicsDefault: 'Tópicos',
    welcomeMessage: 'Mensagem de boas-vindas',
    remove: 'Remover',
    disable: 'Desalibitar',
    users: 'Usuários',
    bots: 'Bots',
    group: 'Grupo',
    details: 'Detalhes',
    languages: 'Tradução automática nos idiomas',
    languagesHint: 'A cada mensagem será verificado o idioma da mensagem e feito a tradução para os idiomas acima, deixe em branco para não gastar créditos.',
    validateFormError: 'Preencha todos os campos obrigatórios.',
    userError: 'ID de usuário inválido.',
    btnSave: 'Salvar alterações',
    successSaving: 'Alterações salvas com sucesso!',
    noChanges: 'Nenhuma alteração detectada.',
    addParticipant: 'Adicionar participante',
    labelUserId: 'Nome do usuario ou Id',
    labelPermission: 'Autoridade:',
    errorFieldsAddParticipant: 'Preencha todos os campos!',
    errorRemoveUser: 'Erro ao remover usuário',
    successAddParticipant: 'Usuário adicionado com sucesso',
    threadDetails: 'Detalhes da sala',
    changeAvatar: 'Alterar avatar',
    errorSaveThreadDeletStatus: 'A thread não pode ser alterada enquanto status "deleting"',
    threadNameInvalid: 'The name must start with #',
}

const message_en = {
    loading: 'Loading...',
    threadName: 'Thread name',
    visibility: 'Visibility',
    visibilityPublic: 'Plubic',
    visibilityPrivate: 'Private',
    visibilityCompany: 'Company',
    visibilityTeam: 'Team',
    status: 'Status',
    statusActive: 'Active',
    statusArchived: 'Archived',
    statusDeleted: 'Deleted',
    statusDeleting: 'Deleting',
    topicsDefault: 'Tópicos',
    welcomeMessage: 'Welcome message',
    remove: 'Remove',
    disable: 'Disable',
    group: 'Group',
    users: 'Users',
    bots: 'Bots',
    languages: 'Automatic translation in multiple languages',
    details: 'Details',
    languagesHint: 'For each message, the language will be detected and translated into the languages above. Leave blank to avoid spending credits.',
    validateFormError: 'Please fill in all required fields.',
    userError: 'Invalid user ID.',
    btnSave: 'Save changes',
    successSaving: 'Saving sucessfully',
    noChanges: 'No changes.',
    addParticipant: 'Add Participant',
    labelUserId: 'User id or name',
    labelPermission: 'Auth:',
    errorFieldsAddParticipant: 'Fill in all fields!',
    errorRemoveUser: 'Error on remove user',
    successAddParticipant: 'User added sucessfully',
    threadDetails: 'Thread details',
    changeAvatar: 'Change avatar',
    errorSaveThreadDeletStatus: 'The thread cannot be changed when status is "deleting"',
    threadNameInvalid: 'O nome deve começar com #',

}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-thread-details-102025')
export class CollabMessagesThreadDetails extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property() userId: string | undefined = '20250417120841.1000';

    @property() threadDetails?: IThreadDetails = { "thread": {} } as IThreadDetails;

    @query('collab-messages-change-avatar-102025') avatarEl?: HTMLElement;

    @property() labelOk: string = '';
    @property() labelError: string = '';
    @property() labelErrorRemoveUser: string = '';
    @property() labelErrorRemoveBoot: string = '';

    @state() private isLoading: boolean = false;
    @state() private editedThreadDetails?: IThreadDetails;

    @state() private isDirectMessage?: boolean = false;
    @state() private isChannel?: boolean = false;
    @state() private isFileChannel?: boolean = false;

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.editedThreadDetails = JSON.parse(JSON.stringify(this.threadDetails));
    }

    async updated(changedProperties: Map<string, any>) {
        super.updated(changedProperties);

        if (changedProperties.has('threadDetails') && this.threadDetails && this.userId) {

            for (const user of this.threadDetails?.thread.users || []) {
                const find = this.threadDetails?.users.find((u) => u.userId === user.userId);
                if (!find) {
                    const resUser = await getUser(user.userId);
                    if (resUser) {
                        this.threadDetails.users.push(resUser);
                        if (this.editedThreadDetails) this.editedThreadDetails.users = [... this.threadDetails.users];
                        this.requestUpdate();
                    }
                    else {
                        const data = await this.getThreadInfo(this.threadDetails.thread.threadId, this.userId);
                        this.threadDetails = data;
                        this.editedThreadDetails = JSON.parse(JSON.stringify(this.threadDetails));
                    }
                }
            }
        }

    }

    render() {

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        this.isDirectMessage = this.threadDetails?.thread?.name?.startsWith('@');
        this.isChannel = this.threadDetails?.thread?.name?.startsWith('#');
        this.isFileChannel = this.threadDetails?.thread?.name?.startsWith('_');


        return html`
        <div class="content">
            <div class="details">
                <h3>${this.msg.details}: ${this.threadDetails?.thread.threadId}</h3>

                ${this.isChannel ? html`
                    <collab-messages-change-avatar-102025
                        ?disabled
                        userId=${this.userId}
                        threadId=${this.threadDetails?.thread.threadId}
                        value=${ifDefined(this.threadDetails?.thread.avatar_url)}
                        @value-changed=${(e: CustomEvent<string>) => {
                    if (this.editedThreadDetails) {
                        this.editedThreadDetails.thread.avatar_url = e.detail;
                    }
                }}
                    ></collab-messages-change-avatar-102025>
                `: ''}

            
            <label>${this.msg.threadName}
                <input type="text" required
                    .value=${this.editedThreadDetails?.thread.name}
                    pattern=${ifDefined(this.isChannel ? "^#.*" : undefined)}
                    ?disabled=${this.isDirectMessage || this.isFileChannel}
                    @input=${(e: Event) => { if (this.editedThreadDetails && !this.isChannel) this.editedThreadDetails.thread.name = (e.target as HTMLInputElement).value }}
                >
                <span class="field-thread-name-error">${this.msg.threadNameInvalid}</span>

            </label>

            <label>${this.msg.status}
                <select 
                    name="status" 
                    required
                    .disabled=${['deleting'].includes(this.editedThreadDetails?.thread.status || '')}
                    .value=${this.editedThreadDetails?.thread.status}
                    @change=${(e: Event) => {
                    if (this.editedThreadDetails) {
                        this.editedThreadDetails.thread.status =
                            (e.target as HTMLSelectElement).value as mls.msg.ThreadStatus;
                    }
            }}
                >
                    <option value="active">${this.msg.statusActive}</option>
                    <option value="archived">${this.msg.statusArchived}</option>
                    <option 
                        value="deleting" 
                        ?hidden=${this.editedThreadDetails?.thread.status !== 'deleting'}
                    >
                        ${this.msg.statusDeleting}
                    </option>
                    <option value="deleted">${this.msg.statusDeleted}</option>
                </select>
            </label>


             <label> ${this.msg.visibility}
                <select name="visibility" required
                    ?disabled=${this.isDirectMessage || this.isFileChannel}
                    .value=${this.editedThreadDetails?.thread.visibility}
                    @change=${(e: Event) => { if (this.editedThreadDetails && this.isChannel) this.editedThreadDetails.thread.visibility = (e.target as HTMLInputElement).value as mls.msg.ThreadVisibility }}>
                    <option value="public">${this.msg.visibilityPublic}</option>
                    <option value="private">${this.msg.visibilityPrivate}</option>
                    <option value="company">${this.msg.visibilityCompany}</option>
                    <option value="team">${this.msg.visibilityTeam}</option>
                </select>
            </label>
            
            <label> ${this.msg.topicsDefault}</label>
            <collab-messages-input-tag-102025 
                pattern="^\\+[a-zA-Z0-9-]+$"
                .value=${this.editedThreadDetails?.thread.defaultTopics?.join(',')}
                placeholder="+topic"
                .onValueChanged=${(value: string) => {
                if (this.editedThreadDetails) {
                    this.editedThreadDetails.thread.defaultTopics = value.split(',');
                }
            }}
                id="topicsInput"
            ></collab-messages-input-tag-102025>

            ${this.isChannel ? html`
                <label> ${this.msg.welcomeMessage}</label>
                <textarea 
                    name="welcomemessage"
                    rows="5" 
                    .value=${this.editedThreadDetails?.thread?.welcomeMessage || ''}
                    @input=${(e: Event) => { if (this.editedThreadDetails && this.isChannel) this.editedThreadDetails.thread.welcomeMessage = (e.target as HTMLInputElement).value }}
                ></textarea>  
            ` : ''}
                
            <label> ${this.msg.languages}</label>
            <collab-messages-input-tag-102025 
                pattern="^[a-z]{2}$|^[a-z]{2}-[A-Z]{2}$"
                .value=${this.editedThreadDetails?.thread?.languages?.join(',')}
                .onValueChanged=${(value: string) => { if (this.editedThreadDetails) this.editedThreadDetails.thread.languages = value.split(',') }}
                id="languageInput"
            ></collab-messages-input-tag-102025>
            <small> ${this.msg.languagesHint}</small>
    
            <div class="actions">
                <button
                @click=${this.saveChanges}
                ?disabled=${this.isLoading}
                >
                    ${this.isLoading ? html`<span class="loader"></span>` : this.msg.btnSave}
                </button>
                ${this.labelOk ? html`<small class="saving-ok">${this.labelOk}<small>` : ''}
                ${this.labelError ? html`<small class="saving-error">${this.labelError}<small>` : ''}   
            </div>

        </div>
        ${this.renderUsers()}
        ${this.renderBots()}

      </div>

    `;
    }

    private renderUsers() {
        const users = this.editedThreadDetails?.users || [];
        const isDm = this.threadDetails?.thread?.name?.startsWith('@');

        return html`
        <div class="users">
            <h3>${this.msg.users}</h3>
            <ul>
                ${repeat(
            this.editedThreadDetails?.thread.users || [],
            ((user: { userId: string }) => user.userId) as any,
            ((user: { userId: string, auth: string }) => {
                const details = users.find((us) => us.userId === user.userId);
                return html`
                                <li>
                                    <img src="${details?.avatar_url}" alt="${details?.name}" width="32" height="32" />
                                    <small>${details?.name}<b>(${user.auth})</b> - ${user.userId}</small>

                                    ${!isDm
                        ? html`<button class="remove" @click="${(e: MouseEvent) => this.removeUser(e, user.userId)}">${this.msg.remove}</button>`
                        : ''
                    }
                                    
                                </li>
                    `;
            }
            ) as any)}
            </ul>
            ${this.labelErrorRemoveUser ? html`<small class="saving-error">${collab_triangle_exclamation} ${this.labelErrorRemoveUser}<small>` : ''}   

            ${!isDm
                ? html`<details class="details-add-participant">
                            <summary>${this.msg.addParticipant}</summary>
                            <div>
                                <collab-messages-add-participant-102025
                                    userId=${this.userId} 
                                    .actualThread=${{ ...this.threadDetails }}
                                    @add-participant=${this.onAddParticipant}
                                    
                                    ></collab-messages-add-participant-102025>
                            </div>
                        </details>`
                : ''
            }
            
        </div>
        `
    }

    private renderBots() {

        return html`
        <div class="bots">
            <h3>${this.msg.bots}</h3>
            <ul>
                ${repeat(
            this.editedThreadDetails?.thread.bots || [],
            ((bot: mls.msg.ThreadBot) => bot.botId) as any,
            ((bot: mls.msg.ThreadBot) => {
                return html`
                        <li>
                            <small>${bot?.botId}<b>(${bot.status})</b></small>
            
                            ${bot.status !== "disabled"
                        ? html`<button class="remove" @click="${(e: MouseEvent) => this.removeBot(e, bot.botId)}">${this.msg.disable}</button>`
                        : ""
                    }                            
                        </li>
                    `;
            }
            ) as any)}
            </ul>
            ${this.labelErrorRemoveBoot ? html`<small class="saving-error">${collab_triangle_exclamation} ${this.labelErrorRemoveBoot}<small>` : ''}   

        </div>
        `
    }

    private async removeUser(e: MouseEvent, userId: string) {
        this.labelErrorRemoveUser = '';
        if (!this.threadDetails || !this.userId || !this.editedThreadDetails) return;

        if (['deleting'].includes(this.editedThreadDetails?.thread.status || '')) {
            this.labelErrorRemoveUser = this.msg.errorSaveThreadDeletStatus;
            return;
        }

        const button = (e.target as HTMLElement).closest('button');
        try {
            button?.classList.add('loading');
            const newThread = await this.removeUserFromThread(this.threadDetails.thread.threadId, this.userId, userId);
            if (newThread) {
                this.threadDetails = JSON.parse(JSON.stringify(this.editedThreadDetails));
                this.editedThreadDetails.thread = { ...newThread };
                const threadCache = await updateThread(newThread.threadId, newThread);
                notifyThreadChange(threadCache);
            }
        } catch (err: any) {
            this.labelErrorRemoveUser = this.msg.errorRemoveUser + ':' + err.message;
        } finally {
            button?.classList.remove('loading');
        }
    }

    private async removeBot(e: MouseEvent, botName: string) {
        this.labelErrorRemoveBoot = '';
        if (!this.threadDetails || !this.userId || !this.editedThreadDetails) return;
        if (['deleting'].includes(this.editedThreadDetails?.thread.status || '')) {
            this.labelErrorRemoveBoot = this.msg.errorSaveThreadDeletStatus;
            return;
        }

        const button = (e.target as HTMLElement).closest('button');
        try {
            button?.classList.add('loading');
            const newThread = await this.disableBot(botName, this.threadDetails.thread.threadId, this.userId);
            this.threadDetails = JSON.parse(JSON.stringify(this.editedThreadDetails));
            this.editedThreadDetails.thread = { ...newThread };

        } catch (err: any) {
            this.labelErrorRemoveBoot = err.message;
        } finally {
            button?.classList.remove('loading');
        }
    }

    private async disableBot(botId: string, threadId: string, userId: string): Promise<mls.msg.Thread> {

        try {
            const rc = await mls.api.msgAddOrUpdateThreadBot({
                botId,
                llmPrompt: "",
                status: "disabled",
                threadId,
                userId,
                config: undefined
            });
            if (rc.statusCode === 200) {
                this.threadDetails = JSON.parse(JSON.stringify(this.editedThreadDetails));
                const threadCache = await updateThread(threadId, rc.thread);
                notifyThreadChange(threadCache);
                await addMessage(threadId, `Bot ${botId} disabled OK!`);
                return rc.thread;
            };

            throw new Error(`"error on disable bot", ${rc.statusCode} : ${rc.msg}`)

        } catch (err: any) {
            throw new Error(`"error on disable bot", ${err.message}`)
        }

    }

    private getChangedFields(): mls.msg.RequestUpdateThread | undefined {
        if (!this.threadDetails || !this.editedThreadDetails) return undefined;

        const original = this.threadDetails.thread;
        const edited = this.editedThreadDetails.thread;

        const fields: (keyof mls.msg.ThreadPerformanceCache)[] = ['group', 'languages', 'name', 'status', 'visibility', 'welcomeMessage', 'defaultTopics', 'avatar_url'];
        const changed: mls.msg.RequestUpdateThread = {
            action: 'updateThread',
            threadId: original.threadId,
            userId: this.userId!,
        };

        for (const field of fields) {
            const origVal = JSON.stringify(original[field]);
            const editVal = JSON.stringify(edited[field]);
            if (origVal !== editVal) {
                (changed as any)[field] = edited[field];
            }
        }

        return changed;
    }

    private onAddParticipant(ev: CustomEvent) {
        const thread = ev.detail.thread;
        if (thread && this.threadDetails) {
            this.threadDetails.thread = { ...thread };
            this.editedThreadDetails = { ...this.threadDetails }
            this.requestUpdate();
        }
    }

    private async saveChanges() {

        this.labelError = '';
        this.labelOk = '';
        if (!this.editedThreadDetails || !this.userId) return;

        if (['deleting'].includes(this.editedThreadDetails?.thread.status || '')) {
            this.labelError = this.msg.errorSaveThreadDeletStatus;
            return;
        }

        const changes = this.getChangedFields();
        if (!changes) return;
        const needUpdateThread = Object.keys(changes).length > 3;

        if (!needUpdateThread) {
            this.labelError = this.msg.noChanges;
            return;
        }

        let newThread: mls.msg.Thread | undefined;
        this.isLoading = true;
        try {

            if (needUpdateThread) {
                const response = await mls.api.msgUpdateThread(changes);
                if (response.statusCode !== 200) {
                    this.labelError = `${response.msg}`;
                    return;
                }
                newThread = response.thread;
            }

            if (newThread) {
                const oldStatus = this.threadDetails?.thread.status;
                this.threadDetails = JSON.parse(JSON.stringify(this.editedThreadDetails));
                let threadCache: mls.msg.ThreadPerformanceCache;

                if (['deleted', 'archived'].includes(newThread.status) && newThread.status !== oldStatus) {
                    await deleteAllMessagesFromThread(newThread.threadId);
                    threadCache = await updateThread(
                        newThread.threadId,
                        newThread,
                        '',
                        '',
                        0,
                        ''
                    );
                } else {
                    threadCache = await updateThread(newThread.threadId, newThread);
                }
                notifyThreadChange(threadCache);
            }

            this.labelOk = `${this.msg.successSaving}`;

        } catch (err: any) {
            console.error(err);
            this.labelError = err.message;
        } finally {
            this.isLoading = false;
        }
    }

    private async removeUserFromThread(threadId: string, userId: string, userIdOrName: string) {
        const params: mls.msg.RequestRemoveUserInThread = {
            action: 'removeUserInThread',
            threadId,
            userId,
            userIdOrName
        };

        try {
            const res = await mls.api.msgUpdateThread(params);
            return res.thread;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    private async getThreadInfo(threadId: string, userId: string): Promise<IThreadDetails> {
        try {
            const response = await mls.api.msgGetThreadUpdate({
                threadId,
                userId,
            });
            return response;
        } catch (err: any) {
            throw new Error(err.message)
        }
    }

}

interface IThreadDetails {
    thread: mls.msg.ThreadPerformanceCache,
    users: mls.msg.User[]
}
