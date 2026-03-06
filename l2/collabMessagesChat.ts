/// <mls fileReference="_102025_/l2/collabMessagesChat.ts" enhancement="_100554_enhancementLit" />

import { html, LitElement, unsafeHTML, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { collab_chevron_left, collab_gear, collab_translate, collab_circle_exclamation, collab_plus, collab_folder_tree, collab_bell } from '/_102025_/l2/collabMessagesIcons.js';
import { removeThreadFromSync, getThreadUpdateInBackground, checkIfNotificationUnread } from '/_102025_/l2/collabMessagesSyncNotifications.js';
import { openElementInServiceDetails, clearServiceDetails, changeFavIcon } from '/_100554_/l2/libCommom.js';

import {
    getTemporaryContext,
    formatTimestamp,
    notifyThreadChange
} from '/_100554_/l2/aiAgentHelper.js';

import { loadAgent, executeBeforePrompt } from '/_100554_/l2/aiAgentOrchestration.js';

import {
    addOrUpdateTask,
    addMessages,
    addMessage,
    updateThread,
    updateUsers,
    getMessage,
    getMessagesByThreadId,
    deleteAllMessagesFromThread,
    listUsers,
    getThread,
    updateLastMessageReadTime
} from '/_102025_/l2/collabMessagesIndexedDB.js';

import {
    IDBThreadPerformanceCache
} from '/_102025_/l2/collabMessagesIndexedDB.js';

import {
    getBotsContext,
    registerToken,
    loadNotificationPreferences,
    loadNotificationDeviceId,
    defaultThreadImage
} from '/_102025_/l2/collabMessagesHelper.js';


import '/_102025_/l2/collabMessagesTaskInfo.js';
import '/_102025_/l2/collabMessagesTask.js';
import '/_102025_/l2/collabMessagesTopics.js';
import '/_102025_/l2/collabMessagesPrompt.js';
import '/_102025_/l2/collabMessagesAvatar.js';
import '/_102025_/l2/collabMessagesThreadDetails.js';
import '/_102025_/l2/collabMessagesUserModal.js';
import '/_102025_/l2/collabMessagesThreadModal.js';
import '/_102025_/l2/collabMessagesFilter.js';
import '/_102025_/l2/collabMessagesAdd.js';
import '/_102025_/l2/collabMessagesChatMessage.js';
import '/_102025_/l2/collabMessagesRichPreviewText.js';


import { IMessage, IThreadInfo, AGENTDEFAULT } from '/_102025_/l2/collabMessagesHelper.js';
import { CollabMessagesPrompt } from '/_102025_/l2/collabMessagesPrompt.js';
import { CollabMessagesChatMessage102025 } from '/_102025_/l2/collabMessagesChatMessage.js';
import { IAgent } from '/_100554_/l2/aiAgentBase.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';


/// **collab_i18n_start**
const message_pt = {
    loading: 'Carregando...',
    btnAddParticipant: 'Adicionar participante',
    threadDetails: 'Detalhes da sala',
    threadAdd: 'Adicionar sala',
    msgNotSend: 'Mensagem não enviada*',
    noThreads: 'Nenhuma sala disponível no momento.',
    placeholderSearch: 'Digite para filtrar',
    threadArchived: 'A thread foi arquivada por [user] em [date]',
    threadDeleting: 'A thread foi deletada em [date]',
    archived: 'Arquivado',
    deleting: 'Deletando',
    deleted: 'Deletada',
    btnNext: 'Continuar',
    promptPlaceholder: 'Digite aqui... (@ para menções) (@@ para agentes)',
    today: 'Hoje',
    yesterday: 'Ontem',
    newMessages: 'Novas mensagens',
    lastMessagePrefix: 'Você'
}

const message_en = {
    loading: 'Loading...',
    btnAddParticipant: 'Add Participant',
    threadDetails: 'Thread details',
    threadAdd: 'Add thread',
    msgNotSend: 'Message not sent*',
    noThreads: 'No threads available at the moment.',
    placeholderSearch: 'Type to filter',
    threadArchived: 'Thread is archived by [user] in [date]',
    threadDeleting: 'Thread was deleted in [date]',
    archived: 'Archived',
    deleting: 'Deleting',
    deleted: 'Deleted',
    btnNext: 'Next',
    promptPlaceholder: 'Type here... (@ for mentions) (@@ for agents)',
    today: 'Today',
    yesterday: 'Yesterday',
    newMessages: 'New messages',
    lastMessagePrefix: 'You'
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**


@customElement('collab-messages-chat-102025')
export class CollabMessagesChat extends StateLitElement {

    private msg: MessageType = messages['en'];

    @query('collab-messages-prompt-102025') collabMessagesPrompt: CollabMessagesPrompt | undefined;
    @query('.new-messages-label') private unreadEl!: HTMLDivElement | undefined;
    @query('.chat-container') private messageContainer!: HTMLDivElement | undefined;

    @state() private isLoadingThread: boolean = false;
    @state() private filteredThreads: IFilteredThreadsByStatus = { active: [], archived: [], deleted: [], deleting: [] };
    @state() private isThreadError: boolean = false;
    @state() private threadErrorMsg: string = '';
    @state() private lastTopicFilter: string = '';
    @state() private welcomeMessage: string = '';
    @state() private usersAvaliables: mls.msg.User[] = [];

    @property() group: 'CONNECT' | 'APPS' | 'DOCS' | 'CRM' = 'CONNECT';
    @property() userId: string | undefined;
    @property() threadToOpen: string | undefined;
    @property() taskToOpen: string | undefined;
    @property() userDeviceId: string | undefined;
    @property() activeScenerie: IScenery = 'list';
    @property() actualThread: IThreadInfo | undefined;
    @property() actualTask: mls.msg.TaskData | undefined;
    @property() actualMessage: IMessage | undefined;
    @property() actualMessages: IMessage[] = [];
    @property() actualMessagesParsed: IMessageGrouped = {};
    @property() isLoadingMessages: boolean = false;
    @property() searchTerm: string = '';
    @property({ attribute: false }) userThreads: IThread = {};
    @property({ attribute: false }) allThreads: mls.msg.Thread[] = [];
    @property() lastMessageReaded: string | undefined = ''
    @property() unreadCountInSelectedThread: number = 0;

    private isSystemChangeScroll: boolean = false;
    private savedScrollTop = 0;
    private hasMoreMessagesLocalDB = true;
    private hasMoreMessagesBefore: boolean = false;
    private messagesLimit = 10;
    private messagesOffset = 0;
    private isLoadingMoreMessages = false;
    private isChangeTopics = false;
    private wasMessagesAtBottom: boolean = true;

    async updated(changedProperties: Map<PropertyKey, unknown>) {

        super.updated(changedProperties);

        if (changedProperties.has('activeScenerie') && (this.activeScenerie === 'list')) {
            this.usersAvaliables = await listUsers();
        }

        if (changedProperties.has('threadToOpen')) {
            if (this.threadToOpen) {
                if (this.activeScenerie !== 'list') {
                    this.activeScenerie = 'list';
                    await this.updateComplete;
                }

                const threadElement = this.querySelector(
                    `[threadId="${this.threadToOpen}"]`
                ) as IHTMLLiThreadItem;

                if (!threadElement) return;
                const detailsParent = threadElement.closest('details');
                if (detailsParent && !detailsParent.open) {
                    detailsParent.open = true;
                    await this.updateComplete;
                }

                this.onThreadClick(threadElement.item);
            }
        }

        if (changedProperties.has('activeScenerie')
            && (changedProperties.get('activeScenerie') === 'task'
                || changedProperties.get('activeScenerie') === 'addParticipant'
                || changedProperties.get('activeScenerie') === 'threadDetails'
            )
            && this.activeScenerie === 'details') {
            this.restoreScrollPosition();
        }

        if (changedProperties.has('actualMessagesParsed') && this.actualMessagesParsed !== undefined) {
            await this.verifyChatScroll();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.onDocumentClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('task-change', this.onTaskChange);
        window.removeEventListener('task-details-close', this.onTaskDetailsClose);
        window.removeEventListener('thread-change', this.onThreadChange.bind(this));
        window.removeEventListener('message-send', this.onMessageSend);
        document.removeEventListener("visibilitychange", this.onVisibilityChange.bind(this));
        document.removeEventListener('click', this.onDocumentClick);

    }

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        window.addEventListener('task-change', this.onTaskChange);
        window.addEventListener('task-details-close', this.onTaskDetailsClose);
        window.addEventListener('thread-change', this.onThreadChange.bind(this));
        window.addEventListener('message-send', this.onMessageSend);
        document.addEventListener("visibilitychange", this.onVisibilityChange.bind(this));
    }

    render() {
        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        if (this.activeScenerie === 'loading') {
            return html`<div class="loading">${this.msg.loading}</div>`;
        }
        return html`
            ${this.renderHeader()}
            ${this.renderContent()}`;
    }

    private renderHeader() {
        switch (this.activeScenerie) {
            case 'task':
                return html`
                    <div class="header">
                        <span @click=${this.onTitleClick}>${collab_chevron_left} <span class="header-title">Task: ${this.actualTask?.PK || ''}</span></span>
                    </div>`;
            case 'details':
                return html`
                    <div class="header">
                        <span @click=${this.onTitleClick}>${collab_chevron_left} <span class="header-title">Thread: ${this.getThreadName(this.actualThread)}</span></span>
                        ${this.actualThread?.thread.status !== 'deleted' ? html`
                            <div class="header-actions">
                                <span @click=${this.onThreadDetailsClick}>${collab_gear}</span>
                            </div>
                        `: ''}                        
                    </div>`;
            case 'list':
                return html`<div class="header">
                    ${this.renderThreadSearch()}
                    <div class="header-actions">
                            <span @click=${this.onThreadAddClick}>${collab_plus}</span>
                    </div>
                </div>`;
            case 'threadDetails':
                return html`
                    <div class="header">
                        <span @click=${this.onTitleClick}>${collab_chevron_left} ${this.msg.threadDetails}</span>
                    </div>`;
            case 'threadAdd':
                return html`
                    <div class="header">
                        <span @click=${this.onTitleClick}>${collab_chevron_left} ${this.msg.threadAdd}</span>
                    </div>`;
            default:
                return null;
        }
    }

    private renderContent() {
        switch (this.activeScenerie) {
            case 'list':
                return this.renderListThreads();
            case 'details':
                return this.renderChatMessages();
            case 'task':
                return this.renderTaskDetails();
            case 'threadDetails':
                return this.renderThreadDetails();
            case 'threadAdd':
                return this.renderThreadAdd();
            default:
                return null;
        }
    }

    private renderChatMessages() {
        if (!this.actualThread) return html``;

        if (this.welcomeMessage && !['deleting', 'deleted', 'archived'].includes(this.actualThread?.thread.status)) {
            return this.renderWelcomeMessage();
        }

        if (this.actualThread.thread.status === 'deleting' || this.actualThread.thread.status === 'deleted') {
            const formatedTimestamp = formatTimestamp(this.actualThread.thread.deletedAt || '');
            const deletedAt = this.parseLocalDate(formatedTimestamp?.dateFull || '');
            return html`
                <div>${this.msg.threadDeleting.replace('[date]', deletedAt.datafull)}</div>
            `
        }

        if (this.actualThread.thread.status === 'archived') {
            const formatedTimestamp = formatTimestamp(this.actualThread.thread.archivedAt || '');
            const archivedAt = this.parseLocalDate(formatedTimestamp?.dateFull || '');
            const archivedBy = this.actualThread.users.find((user) => user.userId === this.actualThread?.thread.archivedBy)
            return html`
                <div>${this.msg.threadArchived.replace('[user]', archivedBy?.name || '').replace('[date]', archivedAt.datafull)}</div>
            `
        }

        const sortedEntries = Object.entries(this.actualMessagesParsed)
            .map(([date, value]) => [date.trim(), value])
            .sort(([a], [b]) => new Date(a as string).getTime() - new Date(b as string).getTime());

        const sortedObj: IMessageGrouped = Object.fromEntries(sortedEntries);
        let nextNeedShowLabel: boolean = false;

        return html`
            ${this.renderTopics()}
            <div
                @scroll=${this.onChatScroll} class="chat-container"
                @copy=${this.onCopyChat}
            >
                ${Object.keys(sortedObj).map((key, index) => {
            const threadMessages = sortedObj[key];
            const messageTime = this.parseLocalDate(key);
            const displayDate = this.formatMessageDate(messageTime.dateObject);
            return html`
                    <div class="message-time">${displayDate}</div>
                        ${threadMessages.map((message) => {
                if (this.lastMessageReaded === message.createAt && this.unreadCountInSelectedThread) nextNeedShowLabel = true;
                else nextNeedShowLabel = false;
                return html`
                                <collab-messages-chat-message-102025
                                    messageId=${message.createAt}
                                    .message=${message}
                                    .allThreads=${this.allThreads}
                                    .actualThread=${this.actualThread}
                                    .usersAvaliables=${this.usersAvaliables}
                                    .userId=${this.userId}
                                    .onTaskClick=${this.onTaskClick.bind(this)}
                                    @reply-preview-click=${this.onReplyPreviewClick}
                                    @reply-message=${this.onReplyMessageClick}
                                ></collab-messages-chat-message-102025>
                                ${nextNeedShowLabel ? html`<div class="new-messages-label">${this.msg.newMessages}</div>` : ''}`
            })}`
        })}
                        ${this.isLoadingMessages ? html`<div class="unread-messages">Loading messages...</div>` : html``}
                        ${this.isThreadError ? html`<div class="error-messages">${this.threadErrorMsg}</div>` : html``}
                    </div>
                ${this.renderPrompt()}`
    }

    private renderWelcomeMessage() {
        return html`
            <div class="welcome-message">
                <p>${this.welcomeMessage}</p>
                <button @click=${() => { this.welcomeMessage = ''; }}>${this.msg.btnNext}</button>       
            </div>`
    }

    private renderTopics() {
        return html`
            <collab-messages-topics-102025
                .selectedTopic=${this.lastTopicFilter === '' ? 'all' : this.lastTopicFilter}
                .messages=${this.actualMessages}
                .threadTopics=${this.actualThread?.thread.defaultTopics || []}
                @topic-selected=${(e: CustomEvent) => this.onTopicClick(e)}
            ></collab-messages-topics-102025>
        `
    }

    private async onTopicClick(e: CustomEvent) {

        this.lastTopicFilter = e.detail.topic === 'all' ? '' : e.detail.topic;
        this.isChangeTopics = true;
        if (e.detail.topic === 'all') this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        else this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        await this.updateComplete;

        if (this.messageContainer) {
            const newHeight = this.messageContainer.scrollHeight;
            this.messageContainer.scrollTop = newHeight;
        }

    }

    private removeAllModal() {
        const all = this.querySelectorAll('collab-messages-user-modal-102025');
        const all2 = this.querySelectorAll('collab-messages-thread-modal-102025');
        [...all, ...all2].forEach((item) => item.remove());
    }


    private renderPrompt() {
        return html`
            <collab-messages-prompt-102025
                acceptAutoCompleteAgents="true"
                acceptAutoCompleteUser="true"
                threadId=${this.actualThread?.thread.threadId}
                .onSend=${this.handleSend.bind(this)}
                placeholder=${this.msg.promptPlaceholder}
                @textarea-resize=${this.handlePromptResize}
            ></collab-messages-prompt-102025>
        `;
    }

    private renderListThreads() {

        if (!this.userThreads[this.group] || (this.userThreads[this.group].length === 0 && !this.isLoadingThread)) {
            return html`<div style="padding:1rem;">${this.msg.noThreads}</div>`;
        }

        const ordenedThreads = this.getOrdenedThreadsByStatus();
        this.filteredThreads = this.getFilteredThreads(ordenedThreads);

        return html`
            ${this.renderThreadsByStatus2()}
            ${this.isLoadingThread ? html`<div>${this.msg.loading}</div>` : ''}
        `;
    }

    private getThreadAvatar(item: IFilteredThreads) {
        let threadAvatar = defaultThreadImage;
        if (item.thread.name.startsWith('@') && item.thread.users.length === 2) {
            const user = item.users.find((user) => user.userId !== this.userId);
            if (user && user.avatar_url) threadAvatar = user.avatar_url;
        } else if (item.thread.avatar_url) {
            threadAvatar = item.thread.avatar_url;
        }
        return threadAvatar;
    }

    private getThreadName(item: IThreadInfo | undefined) {

        if (!item) return '';
        if (this.isDirectMessage(item)) {
            const user = item.users.find((user) => user.userId !== this.userId);
            if (user) return '@' + user.name;
        }
        return item.thread.name || item.thread.threadId;
    }

    private isDirectMessage(item: IThreadInfo) {
        return item.thread.name.startsWith('@') && item.thread.users.length === 2
    }

    private renderThreadsByStatus2() {
        const groups = this.groupThreadsByPrefix(this.filteredThreads.active);

        return html`
        <ul class="thread-list">
            ${Object.entries(groups).map(([prefix, items]) => {
            if (items.length === 1) {
                return this.renderThreadItemLi(items[0]);
            } else {
                const lastItem = items[0];

                const unreadCount = items.reduce(
                    (total, item) => total + (item.thread?.unreadCount || 0),
                    0
                );
                const pendingTasksCount = items.reduce(
                    (total, item) => total + (item?.thread?.pendingTasks?.length || 0),
                    0
                );

                const now = new Date();
                const isToday =
                    lastItem._lastMessageDate.dateObject.getFullYear() === now.getFullYear() &&
                    lastItem._lastMessageDate.dateObject.getMonth() === now.getMonth() &&
                    lastItem._lastMessageDate.dateObject.getDate() === now.getDate();

                const displayDate = isToday
                    ? lastItem._lastMessageDate.time
                    : this.formatMessageDate(lastItem._lastMessageDate.dateObject);


                return html`
                        <li class="thread-group">
                            <details>
                                <summary class="group-title">
                                    <div class="thread-group-avatar">
                                        ${collab_folder_tree}
                                    </div>
                                    <div class="thread-group-content">
                                        <div class="thread-group-item-header">
                                            <span class="thread-group-name">${prefix}</span>
                                            <span class="last-group-update">
                                                ${this.renderTaskPendingsCount(pendingTasksCount)}
                                                ${displayDate}
                                            
                                            </span>
                                        </div>
                                        <div class="thread-group-summary">
                                            <span class="last-group-message">${items.length} Threads </span>
                                            ${unreadCount > 0 ? html`<span class="unread-count">${unreadCount}</span>` : nothing}
                                        </div>
                                    </div>                                
                                </summary>
                                <ul class="group-items">
                                    ${items.map(item => this.renderThreadItemLi(item, prefix))}
                                </ul>
                            </details>
                        </li>
                    `;
            }
        })}
        
            ${this.renderArchivedThreads()}
            ${this.renderDeletingThreads()}
            ${this.renderDeletedThreads()}

        </ul>
    `;
    }

    private renderThreadItemLi(item: IFilteredThreads, prefix?: string) {
        let threadAvatar = this.getThreadAvatar(item);
        let threadName = this.getThreadName(item);
        if (prefix) threadName = threadName.replace(prefix + '/', '');

        const isDirectMessage = this.isDirectMessage(item);

        let lastMessage: string = item.thread.lastMessage || '';

        const firstColonIndex = lastMessage.indexOf(':');

        let userMessageId = lastMessage.slice(0, firstColonIndex);
        let userMessage = lastMessage.slice(firstColonIndex + 1);
        const unreadCount = item.thread.unreadCount || 0;
        const pendingTasksCount = item.thread.pendingTasks?.length || 0;

        const now = new Date();
        const isToday =
            item._lastMessageDate.dateObject.getFullYear() === now.getFullYear() &&
            item._lastMessageDate.dateObject.getMonth() === now.getMonth() &&
            item._lastMessageDate.dateObject.getDate() === now.getDate();

        const displayDate = isToday
            ? item._lastMessageDate.time
            : this.formatMessageDate(item._lastMessageDate.dateObject);

        if (item.users.length > 0) {
            const sortedUsers = [...item.users].sort((a, b) => b.name.length - a.name.length);

            if (userMessageId === this.userId) userMessageId = this.msg.lastMessagePrefix
            else userMessageId = sortedUsers.find(u => u.userId === userMessageId)?.name || '';

            userMessage = userMessage.replace(/\[@([^\]]+)\]\(([^)]+)\)/g, (_m, name, userId) => {
                const user = sortedUsers.find(u => u.userId === userId);
                if (!user) return `@${name}`;
                return `@${user.name}`;
            });
        }

        return html`
        <li .item=${item} threadId=${item.thread.threadId} 
            @click=${() => this.onThreadClick(item)} 
            class="thread-item">
            <div class="thread-item-avatar">
                ${threadAvatar.startsWith('<') && threadAvatar.endsWith('>') ?
                html`${unsafeHTML(threadAvatar)}` :
                html`<img src="${threadAvatar}"></img>`
            }
            </div>
            <div class="thread-content">
                <div class="thread-item-header">
                    <span class="thread-name">${threadName}</span>
                    <span class="last-update">
                        ${this.renderTaskPendingsCount(pendingTasksCount)}
                        ${displayDate}
                    </span>
                </div>
                <div class="thread-summary">
                    ${userMessage ? html`
                            <span class="last-message">${userMessageId && !isDirectMessage ? html`<span>${userMessageId}:</span>` : nothing}${userMessage || ''}</span>
                        `: nothing
            }
                    
                    ${unreadCount > 0 ? html`<span class="unread-count">${unreadCount}</span>` : nothing}
                </div>
            </div>
        </li>
    `;
    }


    private renderTaskPendingsCount(pendingTasksCount: number) {

        return html`
            ${pendingTasksCount > 0 ? html`
                <span class="tasks-pendings-count">
                    ${collab_bell}
                    <span class="notification-badge">${pendingTasksCount}</span>
                </span>` : nothing}
        `

    }

    private formatMessageDate(input: string | Date): string {

        const date = typeof input === 'string' ? new Date(input) : input;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffTime = today.getTime() - target.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return this.msg.today;
        if (diffDays === 1) return this.msg.yesterday;

        const lang = document.querySelector('html')?.lang || 'pt-BR';
        if (diffDays > 1 && diffDays < 7) {
            return target.toLocaleDateString(lang, {
                weekday: 'short',
            });
        }

        return target.toLocaleDateString(lang);
    }


    private renderArchivedThreads() {
        if (this.filteredThreads.archived.length === 0) return html`${nothing}`;
        return html`        
            ${this.filteredThreads.archived.map((item) => {

            let threadAvatar = this.getThreadAvatar(item);
            const unreadCount = item.thread.unreadCount || 0;

            function isWithinLastWeek(date: Date): boolean {
                const now = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            }

            if (!item._lastMessageDateArchived) return html``

            return html`
                ${!isWithinLastWeek(item._lastMessageDateArchived.dateObject)
                    ? html`${nothing}`
                    : html`
                        <li @click=${() => this.onThreadClick(item)} class="thread-item">
                            <div class="thread-item-avatar">
                                    ${threadAvatar.startsWith('<') && threadAvatar.endsWith('>') ?
                            html`${unsafeHTML(threadAvatar)}` :
                            html`<img src="${threadAvatar}"></img>`
                        }
                            </div>
                            <div class="thread-content">
                                <div class="thread-item-header">
                                    <span class="thread-name">(${this.msg.archived}) ${item.thread.name || item.thread.threadId}</span>
                                    ${unreadCount > 0 ? html`<span class="unread-count">*</span>` : nothing}
                                </div>
                            </div>
                        </li>`
                }`
        })}
        `
    }

    private renderDeletingThreads() {
        if (this.filteredThreads.deleting.length === 0) return html``;
        return html`        
            ${this.filteredThreads.deleting.map((item) => {

            let threadAvatar = this.getThreadAvatar(item);
            const unreadCount = item.thread.unreadCount || 0;

            function isWithinLastWeek(date: Date): boolean {
                const now = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            }

            if (!item.lastMessageDateDeleting) return html``

            return html`
                ${!isWithinLastWeek(item.lastMessageDateDeleting.dateObject)
                    ? html``
                    : html`
                        <li @click=${() => this.onThreadClick(item)} class="thread-item">
                            <div class="thread-item-avatar">
                                    ${threadAvatar.startsWith('<') && threadAvatar.endsWith('>') ?
                            html`${unsafeHTML(threadAvatar)}` :
                            html`<img src="${threadAvatar}"></img>`
                        }
                            </div>
                            <div class="thread-content">
                                <div class="thread-item-header">
                                    <span class="thread-name">(${this.msg.deleting}) ${item.thread.name || item.thread.threadId}</span>
                                    ${unreadCount > 0 ? html`<span class="unread-count">*</span>` : nothing}

                                </div>
                            </div>
                        </li>`
                }`
        })}
        `
    }

    private renderDeletedThreads() {
        if (this.filteredThreads.deleted.length === 0) return html``;
        return html`      
          
            ${this.filteredThreads.deleted.map((item) => {
            let threadAvatar = this.getThreadAvatar(item);
            if (!item.lastMessageDateDeleting) return html``
            const unreadCount = item.thread.unreadCount || 0;

            return html`
                <li @click=${() => this.onThreadClick(item)} class="thread-item">
                    <div class="thread-item-avatar">
                            ${threadAvatar.startsWith('<') && threadAvatar.endsWith('>') ?
                    html`${unsafeHTML(threadAvatar)}` :
                    html`<img src="${threadAvatar}"></img>`
                }
                    </div>
                    <div class="thread-content">
                        <div class="thread-item-header">
                            <span class="thread-name" style="text-decoration: line-through;">(${this.msg.deleted}) ${item.thread.name || item.thread.threadId}</span>
                            ${unreadCount > 0 ? html`<span class="unread-count">*</span>` : nothing}
                        </div>
                    </div>
                </li>`
        })}
        `
    }

    private renderThreadSearch() {
        return html`
		<collab-messages-filter-102025
			@search-change=${this.onSearchInput}
            .expanded=${this.searchTerm !== ''}
            .query=${this.searchTerm}
			placeholder=${this.msg.placeholderSearch}>
		</collab-messages-filter-102025>
	`;
    }

    private renderTaskDetails() {
        const messageId = `${this.actualThread?.thread.threadId}/${this.actualMessage?.createAt}`
        return html`<collab-messages-task-info-102025 messageId=${messageId} .task=${this.actualTask} .message=${this.actualMessage} taskId=${this.actualTask?.PK}></collab-messages-task-info-102025>`
    }

    private renderThreadDetails() {
        return html`<collab-messages-thread-details-102025 userId=${this.userId} .threadDetails=${{ ...this.actualThread }}></collab-messages-thread-details-102025>`
    }

    private renderThreadAdd() {
        return html`
            <collab-messages-add-102025 
                .onAddSuccess = ${() => { this.activeScenerie = 'list' }}
                .group=${this.group}
                userId=${this.userId} 
            ></collab-messages-add-102025>`
    }

    private onSearchInput(e: CustomEvent) {

        this.searchTerm = e.detail.toLowerCase();
        const ordenedThreads = this.getOrdenedThreadsByStatus();
        this.filteredThreads = this.getFilteredThreads(ordenedThreads);
    }

    private async updateMessagesAfterScrollMore(newMessages: mls.msg.MessagePerformanceCache[], container: HTMLElement, previousHeight: number) {

        this.actualMessages = [...this.actualMessages, ...newMessages];
        this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        await this.updateComplete;
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight;
    }

    private async getBeforeMessagesInServer(thread: mls.msg.ThreadPerformanceCache) {
        const firstItem = [...this.actualMessages].sort((a, b) => a.orderAt.localeCompare(b.orderAt))[0];
        const response = await this.getMessagesBefore(thread, firstItem.orderAt);
        const newMessages = response?.data;
        this.hasMoreMessagesBefore = response?.hasMore || false;
        return newMessages;
    }

    private onCopyChat(ev: ClipboardEvent) {

        ev.preventDefault();
        const selection = window.getSelection();
        if (!selection) return;
        let container = document.createElement("div");
        for (let i = 0; i < selection.rangeCount; i++) {
            container.appendChild(selection.getRangeAt(i).cloneContents());
        }

        const extractMessage = (el: HTMLElement) => {
            const titleEl = el.querySelector(".message-title");
            const timeEl = el.querySelector(".message-footer");
            const contentEl = el.querySelector(".collab-md-message") as HTMLElement;
            const taskEl = el.querySelector('collab-messages-task-102025') as HTMLElement;
            let author = titleEl?.textContent?.trim();
            const content = contentEl?.innerText?.trim() || "";
            const time = timeEl?.textContent?.trim() || "";
            const task = taskEl?.getAttribute('taskid');
            return {
                author,
                content,
                time,
                task
            }
        }

        const items = container.querySelectorAll(".message-time, .message-card");
        if (items.length === 0) {
            const { author, content, task, time } = extractMessage(container);
            if (content) {
                const msg = `${time ? time : ''} ${author ? author : ''} ${content} ${task ? `(Task:${task})` : ''}`;
                return ev.clipboardData?.setData("text/plain", msg);
            }
            ev.clipboardData?.setData("text/plain", selection.toString());
            return;
        }

        let result: string[] = [];
        let lastAuthor = "";
        let currentDate = "";


        items.forEach(el => {
            if (el.classList.contains("message-time")) {
                currentDate = el.textContent?.trim() || '';
                result.push(`--- ${currentDate} ---`);
            } else {
                let { author, content, task, time } = extractMessage(el as HTMLElement);
                if (!author) author = lastAuthor;
                else lastAuthor = author;
                if (content) {
                    result.push(`${time ? time : ''} ${author ? author : ''} ${content} ${task ? `(Task:${task})` : ''}`);
                }
            }
        });

        if (result.length > 0) {
            ev.clipboardData?.setData("text/plain", result.join("\n"));
        }
    }

    private async onChatScroll(e: Event) {

        this.removeAllModal();
        if (this.isChangeTopics) {
            this.isChangeTopics = false;
            return;
        }

        if (this.isSystemChangeScroll) {
            this.isSystemChangeScroll = false;
            return;
        }

        const container = e.target as HTMLElement;
        this.savedScrollTop = container.scrollTop;
        const threshold = 5;
        this.wasMessagesAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
        const previousHeight = container.scrollHeight;

        if (
            container.scrollTop === 0 &&
            !this.isLoadingMoreMessages &&
            this.actualThread &&
            !this.hasMoreMessagesLocalDB &&
            this.hasMoreMessagesBefore
        ) {
            this.isLoadingMoreMessages = true;
            const newMessages = await this.getBeforeMessagesInServer(this.actualThread.thread);
            if (newMessages) this.updateMessagesAfterScrollMore(newMessages.map(item => ({ ...item, footers: [], })), container, previousHeight);
            this.isLoadingMoreMessages = false;
            return;
        }

        if (
            container.scrollTop === 0 &&
            !this.isLoadingMoreMessages &&
            this.actualThread &&
            this.hasMoreMessagesLocalDB
        ) {

            this.isLoadingMoreMessages = true;
            const newOffset = this.messagesOffset + this.messagesLimit;
            const newMessages = await getMessagesByThreadId(
                this.actualThread.thread.threadId,
                this.messagesLimit,
                newOffset
            );

            if (newMessages.length > 0) {
                this.messagesOffset = newOffset;
                this.updateMessagesAfterScrollMore(newMessages, container, previousHeight);
            } else {
                const newMessages = await this.getBeforeMessagesInServer(this.actualThread.thread);
                if (newMessages) this.updateMessagesAfterScrollMore(newMessages.map(item => ({ ...item, footers: [], })), container, previousHeight);
                this.hasMoreMessagesLocalDB = false;
            }

            this.isLoadingMoreMessages = false;
        }
    }

    private groupThreadsByPrefix(threads: IFilteredThreads[]) {

        const groups: Record<string, IFilteredThreads[]> = {};

        for (const t of threads) {
            const name = this.getThreadName(t);
            if (name.startsWith('_') && name.includes('/')) {
                const [prefix] = name.split('/');
                if (!groups[prefix]) groups[prefix] = [];
                groups[prefix].push(t);
            } else {
                groups[name] = [t];
            }
        }

        return groups;
    }

    private getOrdenedThreadsByStatus(): IFilteredThreadsByStatus {
        const threads = this.userThreads[this.group]
            .map((item) => {
                const lastTimestamp = item.thread.lastMessageTime
                    ? item.thread.lastMessageTime
                    : item.thread.history[0].timestamp;

                const formatedTimestamp = formatTimestamp(lastTimestamp)?.dateFull;
                const lastMessageDate = this.parseLocalDate(formatedTimestamp || '');
                let lastMessageDateArchived;
                let lastMessageDateDeleting;

                if (item.thread.status === 'archived' && item.thread.archivedAt) {
                    const formatedTimestampArchived = formatTimestamp(item.thread.archivedAt)?.dateFull;
                    lastMessageDateArchived = this.parseLocalDate(formatedTimestampArchived || '');
                }

                if ((item.thread.status === 'deleting' || item.thread.status === 'deleted') && item.thread.deletedAt) {
                    const formatedTimestampArchived = formatTimestamp(item.thread.deletedAt)?.dateFull;
                    lastMessageDateDeleting = this.parseLocalDate(formatedTimestampArchived || '');
                }

                return {
                    ...item,
                    _lastMessageDate: lastMessageDate,
                    _lastMessageDateArchived: lastMessageDateArchived,
                    lastMessageDateDeleting: lastMessageDateDeleting,

                };
            })
            .sort((a, b) =>
                b._lastMessageDate.dateObject.getTime() -
                a._lastMessageDate.dateObject.getTime()
            );

        const result = {
            archived: [] as IFilteredThreads[],
            deleted: [] as IFilteredThreads[],
            deleting: [] as IFilteredThreads[],
            active: [] as IFilteredThreads[],
        };

        for (const threadInfo of threads) {
            if (threadInfo.thread.status === 'archived') {
                result.archived.push(threadInfo);
            } else if (threadInfo.thread.status === 'deleted') {
                result.deleted.push(threadInfo);
            } else if (threadInfo.thread.status === 'deleting') {
                result.deleting.push(threadInfo);
            } else {
                result.active.push(threadInfo);
            }
        }

        return result;
    }
    private getFilteredThreads(ordened: IFilteredThreadsByStatus): IFilteredThreadsByStatus {
        if (!this.searchTerm) return ordened;

        const term = this.searchTerm.toLowerCase();

        Object.keys(ordened).forEach((key: string) => {
            const key2 = key as 'deleted' | 'archived' | 'active' | 'deleting';

            ordened[key2] = ordened[key2].filter(item => {
                const threadName = item.thread.name?.toLowerCase() ?? '';

                if (threadName.startsWith('@')) {
                    const users = item.thread.users
                        .map(u => this.usersAvaliables.find(au => au.userId === u.userId));
                    return users.some(user =>
                        (`@${user?.name.toLowerCase()}`).includes(term)
                    );
                }

                return threadName.includes(term);
            });
        });

        return ordened;
    }

    private async getMessagesAfter(thread: mls.msg.Thread, lastOrderAt: string = ''): Promise<mls.msg.ResponseGetMessagesAfter | undefined> {
        if (!this.userId) {
            return undefined;
        }
        const response = await mls.api.msgGetMessagesAfter({
            lastOrderAt,
            threadId: thread.threadId,
            userId: this.userId
        });
        return response;

    }

    private async getMessagesBefore(thread: mls.msg.Thread, orderAt: string = ''): Promise<mls.msg.ResponseGetMessagesAfter | undefined> {
        if (!this.userId) {
            return undefined;
        }
        const response = await mls.api.msgGetMessagesBefore({
            orderAt,
            threadId: thread.threadId,
            userId: this.userId
        });
        return response;

    }

    private parseMessages(
        rawData: mls.msg.MessagePerformanceCache[],
        topic: string
    ): IMessageGrouped {
        const groupedByDay: IMessageGrouped = {};

        [...rawData].forEach(msg => {

            if (
                topic &&
                msg.content &&
                !(
                    msg.content.startsWith(`${topic} `) ||
                    msg.content.endsWith(` ${topic}`) ||
                    msg.content.includes(` ${topic} `)
                )
            ) {
                return;
            }

            const formatted = formatTimestamp(msg.createAt);
            const dateKey =
                formatted?.date ||
                msg.createAt
                    .slice(0, 8)
                    .replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

            if (!groupedByDay[dateKey]) {
                groupedByDay[dateKey] = [];
            }
            groupedByDay[dateKey].push(msg);
        });


        for (const day in groupedByDay) {
            groupedByDay[day].sort((a, b) =>
                a.orderAt.localeCompare(b.orderAt)
            );
        }

        return this.groupMessages(groupedByDay);
    }

    private groupMessages(groupedByDay: IMessageGrouped): IMessageGrouped {
        const result: IMessageGrouped = {};

        Object.keys(groupedByDay).forEach((key) => {
            let consecutiveCount = 0;
            let lastSenderId: string | null = null;

            result[key] = groupedByDay[key].map((msg, index, arr) => {
                let isSame = false;

                if (msg.senderId === lastSenderId) {
                    consecutiveCount++;
                    isSame = true;
                    if (consecutiveCount >= 3) {
                        consecutiveCount = 0;
                        isSame = false;
                    }

                } else {
                    consecutiveCount = 0;
                    isSame = false;
                    lastSenderId = msg.senderId;
                }

                return { ...msg, isSame };
            });
        });

        return result;
    }

    private parseLocalDate(dateString: string) {

        const normalized = dateString.includes(' ')
            ? dateString.replace(' ', 'T')
            : `${dateString}T00:00:00`;

        const date = new Date(normalized);

        return {
            dateObject: date,
            datafull: date.toLocaleString(),
            date: date.toLocaleDateString(),
            time: date.toTimeString().split(' ')[0]
        };
    }

    private mergeMessages(
        array1: mls.msg.MessagePerformanceCache[],
        array2: mls.msg.MessagePerformanceCache[]
    ): mls.msg.MessagePerformanceCache[] {
        const map = new Map<string, mls.msg.MessagePerformanceCache>();
        for (const item of array1) {
            map.set(`${item.threadId}/${item.createAt}`, item);
        }
        for (const item of array2) {
            map.set(`${item.threadId}/${item.createAt}`, { ...map.get(`${item.threadId}/${item.createAt}`), ...item });
        }
        return Array.from(map.values());
    }

    private async onThreadClick(threadInfo: IThreadInfo) {

        this.welcomeMessage = '';
        this.activeScenerie = 'loading';
        this.lastTopicFilter = '';
        this.messagesOffset = 0;
        this.hasMoreMessagesLocalDB = true;
        this.hasMoreMessagesBefore = false;
        this.actualThread = threadInfo;
        const temp = await getThread(this.actualThread.thread.threadId)
        this.unreadCountInSelectedThread = temp?.unreadCount || 0;
        const messagesInDb = await getMessagesByThreadId(this.actualThread.thread.threadId, this.messagesLimit, 0);
        this.actualMessages = messagesInDb;
        this.isSystemChangeScroll = true;
        this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        this.activeScenerie = 'details';
        this.isLoadingMessages = true;
        this.isThreadError = false;
        this.threadErrorMsg = '';
        this.checkWelcomeMessage(this.actualThread.thread, messagesInDb);
        this.lastMessageReaded = (threadInfo.thread as any).lastMessageReadTime;

        try {
            if (!this.userId) return;
            const threadByServer = await this.getThreadInfo(this.actualThread.thread.threadId, this.userId, threadInfo.thread.lastSync || new Date('2000-01-01').toISOString());
            await updateThread(threadByServer.thread.threadId, threadByServer.thread);
            threadInfo = await this.updateMessagesOnDb(threadByServer, threadByServer.messages);

            await updateUsers(threadByServer.users);
            this.actualThread = { ...threadByServer };
            if (threadByServer.hasMore) await this.loadAllMessages(threadInfo);
            this.checkForRegisterNotification();

            if (threadByServer.threadsPending) {
                for await (let threadsPending of threadByServer.threadsPending) {
                    if (threadsPending !== threadInfo.thread.threadId) {
                        removeThreadFromSync(threadsPending);
                        await getThreadUpdateInBackground(threadsPending);
                    }
                }
            }

            if (['deleted'].includes(threadByServer.thread.status)) {
                await deleteAllMessagesFromThread(threadByServer.thread.threadId);
                const threadUpdated = await this.clearUnreadMessageFromThread(threadByServer.thread);
                notifyThreadChange(threadUpdated);
            }

            this.checkNotificationsUnreadMessages();

            if (this.taskToOpen) {
                await this.updateComplete;
                this.openTask();
            }


        } catch (err: any) {
            this.isThreadError = true;
            this.threadErrorMsg = err.message || 'Error on read thread';
            throw new Error('Error on loading messages: ' + err.message);
        } finally {
            this.isLoadingMessages = false;
        }
    }

    private openTask() {
        let taskEl: Element | null = null;
        if (this.taskToOpen === 'last') {
            const tasks = this.querySelectorAll('collab-messages-task-102025');
            taskEl = tasks[tasks.length - 1] || null;
        } else {
            taskEl = this.querySelector(`collab-messages-task-102025[taskid="${this.taskToOpen}"]`);
        }

        if (taskEl) {
            taskEl.dispatchEvent(new CustomEvent('taskclick', {
                bubbles: true,
                composed: true
            }));

        }
        this.taskToOpen = '';
    }

    private checkWelcomeMessage(thread: mls.msg.ThreadPerformanceCache, messagesInDb: mls.msg.MessagePerformanceCache[]) {
        if (messagesInDb.length > 0) return;
        if (!thread.welcomeMessage) return;
        this.welcomeMessage = thread.welcomeMessage;
    }

    private async checkNotificationsUnreadMessages() {
        const hasPendingMessages = await checkIfNotificationUnread();
        if (!hasPendingMessages) {
            changeFavIcon(false);
            mls.services['102025_serviceCollabMessages_left']?.toogleBadge(false, '_102025_serviceCollabMessages');
        }
    }

    private alreadyCheckForRegisterToken: boolean = false;
    private async checkForRegisterNotification() {
        if (this.alreadyCheckForRegisterToken) return;
        this.alreadyCheckForRegisterToken = true;
        const notificationPreference = loadNotificationPreferences();
        if (notificationPreference === 'denied') return;
        await registerToken();
    }

    private async loadAllMessages(threadInfo: IThreadInfo): Promise<void> {

        const response = await this.getMessagesAfter(threadInfo.thread, threadInfo.thread.lastSync || '');
        if (!response || !response.data || response.data.length === 0 || !this.actualThread || !this.userId) {
            return;
        }
        threadInfo = await this.updateMessagesOnDb(threadInfo, response.data);
        if (!response.hasMore) return;
        return this.loadAllMessages(threadInfo);
    }


    private async updateMessagesOnDb(threadInfo: IThreadInfo, messages: mls.msg.Message[] | undefined) {
        if (!messages) return threadInfo;
        const newMessages: mls.msg.MessagePerformanceCache[] = [];
        for await (let mm of messages) {
            const messageId = `${mm.threadId}/${mm.createAt}`
            const messageOld = await getMessage(messageId);
            const tempMessage: mls.msg.MessagePerformanceCache = { ...mm, footers: messageOld?.footers || [] };
            newMessages.push(tempMessage);
        }


        const lastMessages = newMessages[newMessages.length - 1] || this.actualMessages[0];
        await addMessages(newMessages);
        if (lastMessages && this.actualThread) this.actualThread.thread = await updateLastMessageReadTime(threadInfo.thread.threadId, lastMessages.createAt);
        this.actualMessages = this.mergeMessages(this.actualMessages, newMessages);
        this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        await this.updateLastMessage(threadInfo);
        return threadInfo;
    }

    private async clearUnreadMessageFromThread(thread: mls.msg.Thread) {
        const _thread = await updateThread(
            thread.threadId,
            thread,
            '',
            '',
            0
        );
        if (this.actualThread) this.actualThread.thread = _thread;
        return _thread;
    }

    private async updateLastMessage(threadInfo: IThreadInfo) {
        const keys = Object.keys(this.actualMessagesParsed).sort();
        const lastKey = keys.length > 0 ? keys[keys.length - 1] : null;
        const lastArray = lastKey ? this.actualMessagesParsed[lastKey] : [];
        const lastMessage = lastArray.length > 0 ? lastArray[lastArray.length - 1] : undefined;
        if (lastMessage) {
            const lastMessageText = `${lastMessage.senderId}:${lastMessage.content}`;
            const thread = await updateThread(
                threadInfo.thread.threadId,
                threadInfo.thread,
                lastMessageText,
                lastMessage.createAt,
                0,
                lastMessage.createAt,
            );
            threadInfo.thread = thread;
            notifyThreadChange(thread);
        }
    }

    private async onTitleClick() {
        await this.updateComplete;
        if (this.activeScenerie === 'task') {
            this.activeScenerie = 'details';
            return;
        }
        if (this.activeScenerie === 'details' || this.activeScenerie === 'threadAdd') {
            this.actualThread = undefined;
            this.activeScenerie = 'list';
            return;
        }
        if (this.activeScenerie === 'threadDetails') {
            this.activeScenerie = 'details';
            return;
        }
    }

    private onThreadDetailsClick() {
        this.saveScrollPosition();
        this.activeScenerie = 'threadDetails';
    }

    private onThreadAddClick() {
        this.activeScenerie = 'threadAdd';
    }

    private async handleSend(value: string,
        opt: {
            isSpecialMention: boolean,
            agentName: string,
            replyTo?: string
        }
    ) {
        this.isSystemChangeScroll = true;
        this.lastTopicFilter = '';
        try {
            if (!opt.isSpecialMention) {
                await this.addMessage(value, opt.replyTo);
            } else {
                await this.addMessageIA(value, opt.agentName, opt.replyTo);
            }
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    private handlePromptResize(e: CustomEvent) {
        if (this.wasMessagesAtBottom) {
            const chatEl = this.querySelector('.chat-container') as HTMLElement | null;
            if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
        }
    }

    private async addMessage(prompt: string, replyTo: string | undefined) {
        if (!this.userId || !this.actualThread) return;
        this.unreadCountInSelectedThread = 0;

        const message: IMessage = await this.createTempMessage(prompt, this.userId, this.actualThread.thread.threadId, replyTo);
        try {
            const context: mls.msg.ExecutionContext = {
                message,
                task: undefined,
                isTest: false
            }
            const contextToBot = await getBotsContext(this.actualThread.thread, prompt, context);
            const params: mls.msg.RequestAddMessage = {
                action: 'addMessage',
                content: prompt,
                threadId: this.actualThread.thread.threadId,
                userId: this.userId,
            };
            if (replyTo) params.replyTo = replyTo;
            if (contextToBot) params.contextToBot = contextToBot;
            const response = await mls.api.msgAddMessage(params);
            message.isFailed = false;
            message.isFailedError = '';
            this.updateMessage2(false, true, message, response.message, response.botOutputs);
        } catch (err: any) {
            message.isFailed = true;
            message.isFailedError = err.message;
            message.isLoading = false;
            this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
            console.error('Error on send message:' + err.message);
        }
    }

    private async addMessageIA(prompt: string, agentName: string, replyTo: string | undefined) {
        if (!this.userId || !this.actualThread) return;
        this.unreadCountInSelectedThread = 0;
        const context = getTemporaryContext(this.actualThread.thread.threadId, this.userId, prompt);
        let agentToCall = AGENTDEFAULT;
        if (agentName) agentToCall = agentName;
        const message: IMessage = await this.createTempMessage(prompt, this.userId, this.actualThread.thread.threadId, replyTo);
        try {
            const agent = await this.loadAgent(agentToCall);
            context.message = message;
            await executeBeforePrompt(agent, context);
        } catch (err: any) {
            console.error('Error on send message:' + err.message);
            if (message.isLoading) {
                message.isLoading = false;
                message.isFailed = true;
                message.isFailedError = err.message;
                this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
            }
        }
    }

    private async updateMessageAI(context: mls.msg.ExecutionContext, updateThreadDB: boolean, oldContextCreateAt?: string) {

        if (this.activeScenerie !== 'details') return;
        if (!context.message) return;

        const { content, createAt, orderAt, senderId, threadId, taskId, taskTitle, taskTitleTranslated, taskStatus,
            taskResults, taskResultsTranslated } = context.message;

        const createAt2 = oldContextCreateAt ? oldContextCreateAt : createAt;
        let messageAdded = this.actualMessages.find((item) =>
            item.senderId === senderId &&
            item.createAt === createAt2 &&
            item.threadId === threadId
        );

        if (!messageAdded) {
            const newMessage: mls.msg.MessagePerformanceCache = {
                content,
                createAt,
                orderAt,
                senderId,
                threadId,
                footers: []
            }
            if (updateThreadDB && this.actualThread) {
                const lastMessageText = `${senderId}:${content}`;
                const thread = await updateThread(threadId, this.actualThread.thread, lastMessageText, createAt, 0, createAt);
                if (this.actualThread) this.actualThread.thread = thread;
            }
            if (taskId) newMessage.taskId = taskId;
            this.actualMessages.unshift({ context, lastChanged: new Date().getTime(), ...newMessage });
            this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
            await addMessage(newMessage);
            this.requestUpdate();

        } else {

            messageAdded.content = content;
            messageAdded.senderId = senderId;
            messageAdded.createAt = createAt;
            messageAdded.threadId = threadId;
            messageAdded.orderAt = orderAt;
            // if (status) messageAdded.status = status;
            if (taskTitle) messageAdded.taskTitle = taskTitle;
            if (taskTitleTranslated) messageAdded.taskTitleTranslated = taskTitleTranslated;
            if (taskStatus) messageAdded.taskStatus = taskStatus;
            if (taskResults) messageAdded.taskResults = taskResults;
            if (taskResultsTranslated) messageAdded.taskResultsTranslated = taskResultsTranslated;
            messageAdded.context = context;
            messageAdded.isLoading = false;
            messageAdded.lastChanged = new Date().getTime();
            if (taskId) messageAdded.taskId = taskId;
            const cloned = structuredClone(messageAdded);
            delete cloned.context;
            delete cloned.isLoading;
            delete cloned.lastChanged;
            if (oldContextCreateAt) this.isSystemChangeScroll = true;
            this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
            await addMessage(cloned);
            if (this.actualThread) await this.updateLastMessage(this.actualThread);
            this.requestUpdate();

        }
    }

    private async createTempMessage(content: string, senderId: string, threadId: string, replyTo: string | undefined, taskId?: string) {
        const now = new Date();
        const formattedDate = now.getFullYear().toString()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0')
            + String(now.getHours() + 3).padStart(2, '0')
            + String(now.getMinutes()).padStart(2, '0')
            + String(now.getSeconds()).padStart(2, '0')
            + "." + Math.floor(1000 + Math.random() * 9000);
        const newMessage: IMessage = {
            content,
            createAt: formattedDate,
            orderAt: formattedDate,
            senderId,
            threadId,
            isLoading: true,
            isFailed: false,
            isFailedError: '',
            replyTo,
            footers: []
        }

        if (taskId) newMessage.taskId = taskId;
        this.actualMessages.unshift(newMessage);
        this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        this.requestUpdate();
        return newMessage;
    }

    private async updateMessage2(updateLastSyncThreadDB: boolean, updateLastMessageThreadDB: boolean, oldMessage: IMessage, newMessage: mls.msg.Message, outputs: mls.msg.BotOutput[] | undefined) {

        if (this.actualThread && (updateLastSyncThreadDB || updateLastMessageThreadDB)) {

            const lastMessageText = `${newMessage.senderId}:${newMessage.content}`;

            let thread = await updateThread(
                newMessage.threadId,
                this.actualThread.thread,
                updateLastMessageThreadDB ? lastMessageText : undefined,
                updateLastMessageThreadDB ? newMessage.createAt : undefined,
                0,
                updateLastSyncThreadDB ? newMessage.createAt : undefined,
            );

            thread = await updateLastMessageReadTime(newMessage.threadId, newMessage.createAt)
            if (this.actualThread) this.actualThread.thread = thread;
            notifyThreadChange(this.actualThread.thread);
        }

        const footerData: IMessageFooter[] = [];
        for await (let item of outputs || []) {

            const footerItem: IMessageFooter = {
                title: item.botId,
                lines: [item.output]
            }

            const module = await this.loadAgent(item.botId);
            if (module && module.afterBot && typeof module.afterBot === 'function') {
                const context: mls.msg.ExecutionContext = {
                    message: newMessage,
                    task: undefined,
                    isTest: false
                }
                try {
                    const response = await module.afterBot(context, item);
                    footerItem.lines = [response];

                } catch (err: any) {
                    footerItem.lines = [err.message];
                }
            }

            footerData.push(footerItem);

        }

        const alreadyExist = this.actualMessages.find(item =>
            item.senderId === oldMessage.senderId &&
            item.createAt === oldMessage.createAt &&
            item.threadId === oldMessage.threadId);

        if (alreadyExist) {
            this.actualMessages = this.actualMessages.map(item => {
                if (
                    item.senderId === oldMessage.senderId &&
                    item.createAt === oldMessage.createAt &&
                    item.threadId === oldMessage.threadId
                ) {
                    const { isLoading, isFailed, isFailedError, ...rest }: IMessage = { ...newMessage, isSame: oldMessage.isSame, footers: footerData };
                    return rest;
                }
                return item;
            });
        } else this.actualMessages.unshift({ ...newMessage, footers: footerData });

        const m = newMessage as IMessage;
        delete m.isLoading;
        delete m.isFailed;
        delete m.isFailedError;
        delete m.isSame;

        if (outputs) m.footers = footerData;
        await addMessage(m);
        const messagesInDb = await getMessagesByThreadId(m.threadId, this.messagesLimit, 0);
        this.actualMessages = messagesInDb;
        this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
        this.requestUpdate();

    }

    private async loadAgent(shortName: string): Promise<IAgent> {

        try {
            const agent = await loadAgent(shortName);
            if (!agent) throw new Error(`(loadAgent) createAgent function not found in ${shortName}`);
            return agent as IAgent;
        } catch (error: any) {
            throw new Error(`[loadAgent] ${error.message || error} `);
        }

    }

    private async onTaskClick(taskId: string, messageId: string, threadId: string, message: IMessage) {
        this.saveScrollPosition();
        const task = await this.getTaskUpdate(taskId, messageId, threadId);
        addOrUpdateTask(task);
        this.actualTask = task;
        this.actualMessage = message;
        const messageId2 = `${this.actualThread?.thread.threadId}/${this.actualMessage?.createAt}`
        const el = document.createElement('collab-messages-task-info-102025');
        el.setAttribute('messageId', messageId2);
        if (this.actualTask && this.actualTask.PK) el.setAttribute('taskId', this.actualTask.PK);
        (el as any)['task'] = this.actualTask;
        (el as any)['message'] = this.actualMessage;
        openElementInServiceDetails(el);

    }

    private onReplyPreviewClick(ev: CustomEvent) {

        const messageReply = this.messageContainer?.querySelector(
            `collab-messages-chat-message-102025[messageid="${ev.detail.messageId}"]`
        );
        if (!messageReply) return;
        messageReply.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    private onReplyMessageClick(ev: CustomEvent) {
        if (!ev.detail) return;
        const data = ev.detail as IMessage;
        this.collabMessagesPrompt?.setReply({
            messageId: data.createAt,
            senderId: data.senderId,
            preview: data.content.slice(0, 80)
        });
    }

    private async getTaskUpdate(taskId: string, createdAt: string, threadId: string) {
        if (!taskId || !createdAt || !threadId) throw new Error('Invalid args');
        if (!this.userId) throw new Error('Invalid userId');
        const taskData = await mls.api.msgGetTaskUpdate(
            {
                taskId,
                messageId: `${threadId}/${createdAt}`,
                userId: this.userId
            }
        );
        if (taskData.statusCode !== 200) throw new Error("error on AI get taskUpdate , stoped");
        return taskData.task;
    }

    private async getThreadInfo(threadId: string, userId: string, lastOrderAt: string): Promise<mls.msg.ResponseGetThreadUpdate> {
        const deviceId = loadNotificationDeviceId();

        try {
            const response = await mls.api.msgGetThreadUpdate({
                threadId,
                userId,
                lastOrderAt,
                deviceId: deviceId || undefined
            });
            removeThreadFromSync(threadId);

            if (response.statusCode === 403) {
                throw new Error(response.msg);
            }

            return response;
        } catch (err: any) {
            throw new Error(err.message)
        }
    }

    private saveScrollPosition() {
        if (this.messageContainer) {
            this.savedScrollTop = this.messageContainer.scrollTop;
        }
    }

    private async restoreScrollPosition() {
        if (this.messageContainer) {
            await this.updateComplete;
            await this.waitingForRenderCodesWebComponents();
            this.messageContainer.scrollTop = this.savedScrollTop;
        }
    }

    private onTaskChange = async (e: Event) => {
        const customEvent = e as CustomEvent;
        const message: mls.msg.Message = customEvent.detail.context.message;
        const task: mls.msg.TaskData = customEvent.detail.context.task;
        const thId = message?.threadId;
        if (!this.actualThread || !thId || thId !== this.actualThread.thread.threadId) return;
        await this.updateMessageAI(customEvent.detail.context, false, customEvent.detail.oldContextCreateAt);
        if (task) await addOrUpdateTask(customEvent.detail.context.task);
    };



    private onTaskDetailsClose = async (_e: Event) => {
        const taskId = (_e as CustomEvent).detail;
        clearServiceDetails();
        if (taskId) {
            this.taskToOpen = taskId;
            this.openTask();
        }
    };

    private onThreadChange = async (e: Event) => {

        const customEvent = e as CustomEvent;
        await this.updateMessageAI(customEvent.detail, false);
        const thread = customEvent.detail as mls.msg.Thread;
        const threadUpdated = this.userThreads[this.group].find((th) => th.thread.threadId === thread.threadId);

        if (['deleted'].includes(thread.status)) {
            await deleteAllMessagesFromThread(thread.threadId);
        }

        if (threadUpdated) threadUpdated.thread = { ...threadUpdated.thread, ...thread };
        else if (thread.group === this.group) {
            this.userThreads[this.group] = [...this.userThreads[this.group], { thread, hasMore: false, users: [] }];
        }

        if (threadUpdated?.thread.threadId === this.actualThread?.thread.threadId) {
            this.actualThread = threadUpdated;
            if (this.actualThread && this.actualThread.thread.unreadCount && this.actualThread.thread.unreadCount > 0) {
                const chatEl = this.querySelector('.chat-container') as HTMLElement | null;
                if (chatEl) {
                    const isScrolledToBottom = chatEl.scrollTop + chatEl.clientHeight >= chatEl.scrollHeight - 1;
                    if (isScrolledToBottom) this.isSystemChangeScroll = true;
                }
                const messagesInDb = await getMessagesByThreadId(this.actualThread.thread.threadId, this.messagesLimit, 0);
                this.actualMessages = messagesInDb;
                this.actualMessagesParsed = this.parseMessages(this.actualMessages, this.lastTopicFilter);
                await this.updateLastMessage(this.actualThread);
            }
        }

        if (this.activeScenerie === 'threadDetails' && (
            thread.status === 'deleted' ||
            thread.status === 'deleting' ||
            thread.status === 'archived'
        )) {
            this.activeScenerie = 'list';
        }

        this.requestUpdate();
    };

    private onMessageSend = async (e: Event) => {
        const customEvent = e as CustomEvent;
        const message: mls.msg.Message = customEvent.detail.context.message;
        const outputs: mls.msg.BotOutput[] = customEvent.detail.context.botOutput;
        const thId = message?.threadId;
        if (!this.actualThread || !thId || thId !== this.actualThread.thread.threadId) return;
        this.updateMessage2(false, true, { ...message, footers: [] }, message, outputs);
    };

    private onVisibilityChange() {
        if (this.activeScenerie === 'details') {
            this.checkNotificationsUnreadMessages();
        }
    }

    private onDocumentClick = () => {
        const all = Array.from(this.querySelectorAll('collab-messages-chat-message-102025')) as CollabMessagesChatMessage102025[]
        all.forEach((item: CollabMessagesChatMessage102025) => {
            item.openedReactionMessageId = undefined;
            item.reactionPickerTarget = undefined;
            item.openedMenuFor = undefined;
            item.messageMenuTarget = undefined;
        });
    };


    private async verifyChatScroll() {
        if (this.messageContainer && (this.isSystemChangeScroll)) {
            await this.updateComplete;
            const target = this.unreadEl;
            let offset = this.messageContainer.scrollHeight;
            await this.waitingForRenderCodesWebComponents();
            if (target) target.scrollIntoView({ block: 'center' })
            else this.messageContainer.scrollTop = offset;
            this.isSystemChangeScroll = false;
        }

    }

    private async waitingForRenderCodesWebComponents() {
        if (!this.messageContainer) return;
        const allMessages = Array.from(this.messageContainer.querySelectorAll('collab-messages-chat-message-102025'));
        await Promise.all(
            Array.from(allMessages)
                .map(el => (el as LitElement).updateComplete)
        );

        const allCodes = Array.from(this.messageContainer.querySelectorAll('collab-messages-text-code-102025'));
        await Promise.all(
            Array.from(allCodes)
                .map(el => (el as any).whenRendered)
        );
    }

}

interface IMessageFooter {
    title?: string;
    lines: string[];
    icon?: string; // icon to show in footer, ex: "fa fa-check"
    color?: string; // color of the footer, ex: "#00ff00"
    backgroundColor?: string; // background color of the footer, ex: "#000000"
    timestamp?: string;
}

interface IFilteredThreadsByStatus {
    archived: IFilteredThreads[];
    deleted: IFilteredThreads[];
    deleting: IFilteredThreads[];
    active: IFilteredThreads[];
}

interface IHTMLLiThreadItem extends HTMLElement {
    item: IThreadInfo
}

interface IFilteredThreads {
    _lastMessageDate: {
        dateObject: Date;
        datafull: string;
        date: string;
        time: string;
    };
    _lastMessageDateArchived?: {
        dateObject: Date;
        datafull: string;
        date: string;
        time: string;
    };
    lastMessageDateDeleting?: {
        dateObject: Date;
        datafull: string;
        date: string;
        time: string;
    };
    hasMore?: boolean | undefined,
    thread: IDBThreadPerformanceCache;
    users: mls.msg.User[];
}
type IMessageGrouped = { [key: string]: IMessage[] }
type IThread = { [key: string]: IThreadInfo[] }
type IScenery = 'list' | 'details' | 'loading' | 'task' | 'threadDetails' | 'threadAdd'
