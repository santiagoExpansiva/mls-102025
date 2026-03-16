/// <mls fileReference="_102025_/l2/collabMessagesPrompt.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, ifDefined, nothing } from 'lit';
import { customElement, property, state, query, } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { IAgent } from '/_100554_/l2/aiAgentBase.js'

import { collab_arrow_up_long } from '/_102025_/l2/collabMessagesIcons.js';
import { getThread, listUsers } from '/_102025_/l2/collabMessagesIndexedDB.js';
import { emojiList } from '/_102025_/l2/collabMessagesEmojis.js'

import '/_102025_/l2/collabMessagesAvatar.js';


/// **collab_i18n_start**
const message_pt = {
    replyingTo: 'Respondendo a',
    cancelReply: 'Cancelar resposta'
}

const message_en = {
    replyingTo: 'Responding to',
    cancelReply: 'Cancel reply'
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**


@customElement('collab-messages-prompt-102025')
export class CollabMessagesPrompt extends StateLitElement {

    private msg: MessageType = messages['en'];

    @query('textarea') textArea: HTMLTextAreaElement | undefined;
    @query('.mention-suggestions') mentionSuggestionsElement?: HTMLElement;
    @query('.wrapper') wrapper?: HTMLElement;
    @property() text: string = '';
    @state() actualMention?: IMentions;
    @state() mentionActive: boolean = false;
    @state() mentionQuery: string = '';
    @state() mentionSuggestions: IMentions[] = [];
    @state() mentionIndex: number = 0;
    @state() allUsers: mls.msg.User[] = [];
    @state() allAgents: IMentionAgent[] = [];
    @state() alreadyLoadingAgents: boolean = false;
    @state() lastScopeLoaded: string | undefined;

    @state() replyingTo?: {
        messageId: string;
        senderId: string;
        preview: string;
    };

    @property({ type: Function }) onSend: Function | undefined;
    @property() threadId?: string;
    @property() placeholder?: string;
    @property() scope?: string;
    @property({
        type: Boolean,
        converter: (value: string | null) => value === 'true'
    }) acceptAutoCompleteUser?: boolean = false;

    @property({
        type: Boolean,
        converter: (value: string | null) => value === 'true'
    }) acceptAutoCompleteAgents?: boolean = false;

    connectedCallback() {
        super.connectedCallback();
        window.visualViewport?.addEventListener("resize", () => {
            this.calculatePosition();
        });
    }


    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.adjustTextAreaHeight();
    }

    async updated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);
        if (changedProperties.has('threadId')
            && this.threadId !== ''
            && this.threadId !== changedProperties.get('threadId')
            && this.acceptAutoCompleteUser
        ) {
            this.getUsers();
        }
    }

    public setReply(message: {
        messageId: string;
        senderId: string;
        preview: string;
    }) {
        this.replyingTo = message;
        setTimeout(() => {
            this.textArea?.focus();
        });
    }

    public clearReply() {
        this.replyingTo = undefined;
    }

    private async getUsers() {
        if (!this.threadId) return;
        const thread = await getThread(this.threadId.trim());
        if (!thread) return;
        const users: mls.msg.User[] = await listUsers();
        this.allUsers = users;
    }

    private async getAgents() {
        const agentsFiles = await this.getAgentsFiles();
        const agentsPublic = agentsFiles.map((agent: IAgent) => {
            const { visibility, agentName, avatar_url, agentDescription, scope } = agent;
            if (visibility === 'public') {
                let inScope = this.scope ? false : true;
                if (this.scope && scope) {
                    inScope = scope.includes(this.scope);
                }
                if (!this.scope && scope) inScope = false;
                if (inScope) {
                    return {
                        name: agentName,
                        description: agentDescription,
                        avatar_url,
                        alias: agentName.replace('agent', '')
                    }
                }
            }
        }).filter((item) => !!item);
        this.allAgents = agentsPublic as IMentionAgent[];
    }

    private getCaretCoordinates(): { x: number, y: number } | null {
        if (!this.textArea) return null;

        const div = document.createElement("div");
        const style = getComputedStyle(this.textArea);

        for (const prop of style) {
            div.style.setProperty(prop, style.getPropertyValue(prop));
        }

        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.whiteSpace = "pre-wrap";
        div.style.wordWrap = "break-word";
        div.style.overflow = "hidden";

        const text = this.textArea.value.substring(0, this.textArea.selectionStart);
        const span = document.createElement("span");
        span.textContent = "\u200b";
        div.textContent = text;
        div.appendChild(span);

        this.appendChild(div);
        const rect = span.getBoundingClientRect();
        const coords = { x: rect.left, y: rect.bottom };
        this.removeChild(div);

        return coords;
    }

    private calculatePosition() {
        if (!this.mentionSuggestionsElement || !this.wrapper) return;
        const coords = this.getCaretCoordinates();
        const bound1 = this.wrapper.getBoundingClientRect();
        const bound2 = this.mentionSuggestionsElement.getBoundingClientRect();
        if (!coords) return;

        const viewport = window.visualViewport;

        let x = coords.x;
        let y = coords.y;

        if (viewport) {
            x = coords.x - viewport.offsetLeft;
            y = coords.y - viewport.offsetTop;
        }

        this.mentionSuggestionsElement.style.position = "fixed";
        this.mentionSuggestionsElement.style.left = `${x}px`;
        this.mentionSuggestionsElement.style.top = `${y - bound1.height - bound2.height - 4}px`;
    }

    private adjustTextAreaHeight() {
        const maxHeight = 200;
        const minHeight = 40;
        if (this.textArea) {
            const prevHeight = this.textArea.offsetHeight;
            if (this.text === '') {
                this.textArea.style.height = `${minHeight}px`;
            } else {
                this.textArea.style.height = 'auto';
                this.textArea.style.height = Math.min(this.textArea.scrollHeight, maxHeight) + 'px';
            }
            const newHeight = this.textArea.offsetHeight;
            if (newHeight !== prevHeight) {
                this.dispatchEvent(new CustomEvent('textarea-resize', {
                    detail: {
                        height: newHeight
                    },
                    bubbles: true,
                    composed: true
                }));
            }

            this.calculatePosition();

        }
    }

    private async getAgentsFiles(): Promise<IAgent[]> {
        const keys = Object.keys(mls.stor.files);
        const ret: IAgent[] = [];
        for await (const k of keys) {
            if (k.indexOf('agent') < 0) continue;
            const file = mls.stor.files[k];
            const path = `/_${file.project}_${file.folder ? file.folder + '/' : ''}${file.shortName}`;
            if (file.extension !== '.ts' || !file.shortName.startsWith('agent')) continue;
            try {
                const mdl = await import(path);
                if (!mdl.createAgent) continue;
                const agent = mdl.createAgent() as IAgent
                ret.push(agent);
            } catch (err) {
                console.info(err)
                continue;
            }
        }
        return ret;
    }

    render() {

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];

        return html`
            </div>
                ${this.renderReply()}
            
                <div class="wrapper">
                    <textarea
                        .value=${this.text}
                        @input=${this.handleInput}
                        @focus=${this.handleFocus}
                        @keydown=${this.handleKeyDown}
                        id="prompt_input"
                        placeholder="${ifDefined(this.placeholder)}">
                    </textarea>
                    <button @click=${this.handleSend}>${collab_arrow_up_long}</button>
                    ${this.mentionActive && this.mentionSuggestions.length > 0 ? html`
                        <ul class="mention-suggestions">
                            ${this.mentionSuggestions.map((s, i) => html`
                                <li
                                    class="${i === this.mentionIndex ? 'active' : ''}"
                                    title=${s.description}
                                    @click=${() => this.selectMention(s)}
                                >
                                    ${s.type === 'emoji' ? html`
                                    <span class="emoji-suggestion">${s.text}</span>
                                    <span class="emoji-code">:${s.value}:</span>
                                    ` : s.type === 'agent' ? html`
                                    ${s.avatar_url
                    ? html`<collab-messages-avatar-102025 width="20px" height="20px" avatar=${s.avatar_url}></collab-messages-avatar-102025>`
                    : ''}
                                    <span class="agent-suggestion">${s.text}</span>
                                    ` : s.type === 'user' ? html`
                                    ${s.avatar_url
                    ? html`<collab-messages-avatar-102025 width="20px" height="20px" avatar=${s.avatar_url}></collab-messages-avatar-102025>`
                    : ''}
                                    <span class="user-suggestion">${s.text}</span>
                                    ` : ''}
                                </li>
                                `)}
                        </ul>
                ` : ''}
        </div>`
    }

    private renderReply() {

        const user = this.allUsers?.find(u => u.userId === this.replyingTo?.senderId)
        const name = user?.name || this.replyingTo?.senderId;

        return html`${this.replyingTo ? html`
                <div class="reply-preview">
                    <div class="reply-bar"></div>

                    <div class="reply-content">
                        <div class="reply-user">
                            ${this.msg.replyingTo} @${name}
                        </div>
                        <div class="reply-text">
                            ${this.replyingTo.preview}
                        </div>
                    </div>

                    <button
                        class="reply-cancel"
                        @click=${this.clearReply}
                        title="${this.msg.cancelReply}"
                    >
                        ✕
                    </button>
                </div>
            ` : nothing
            }`
    }
    async handleFocus() {
        if (this.acceptAutoCompleteAgents &&
            (!this.alreadyLoadingAgents || this.scope !== this.lastScopeLoaded)
        ) {
            this.lastScopeLoaded = this.scope;
            this.alreadyLoadingAgents = true;
            this.getAgents();
        }
    }

    async handleInput(e: MouseEvent) {
        if (!e.target) return;
        const target = e.target as HTMLTextAreaElement;
        this.text = target.value;
        this.adjustTextAreaHeight();

        const cursorPos = target.selectionStart;
        const beforeCursor = this.text.slice(0, cursorPos);

        let suggestions: IMentions[] = [];
        let query = '';

        const matchUser = beforeCursor.match(/(?:^|\s)@([a-zA-Z]*)$/);
        if (matchUser && this.acceptAutoCompleteUser) {
            query = matchUser[1];
            suggestions = this.getUserSuggestions(query);
        }

        const matchAgent = beforeCursor.match(/(?:^|\s)@@([a-zA-Z]*)$/);
        if (matchAgent && this.acceptAutoCompleteAgents) {
            query = matchAgent[1];
            suggestions = this.getAgentSuggestions(query);
        }

        const matchEmoji = beforeCursor.match(/::(\w+)$/);
        if (matchEmoji) {
            query = matchEmoji[1];
            suggestions = this.getEmojiSuggestions(query).slice(0, 10);
        }

        if (suggestions.length > 0) {
            this.mentionActive = true;
            this.mentionQuery = query;
            this.mentionSuggestions = suggestions;
            await this.updateComplete;
            this.calculatePosition();
        } else {
            this.mentionActive = false;
            this.mentionSuggestions = [];
            this.mentionQuery = '';
        }
    }

    private getUserSuggestions(query: string): IMentions[] {
        return this.allUsers
            .filter(user => user.name.toLowerCase().startsWith(query.toLowerCase()))
            .map(user => ({
                avatar_url: user.avatar_url,
                text: user.name,
                value: user.name,
                description: user.name,
                type: 'user'
            }));
    }

    private getAgentSuggestions(query: string): IMentions[] {
        return this.allAgents
            .filter(agent =>
                agent.name.toLowerCase().startsWith(query.toLowerCase()) ||
                agent.alias.toLowerCase().startsWith(query.toLowerCase())
            )
            .map(agent => ({
                text: agent.alias,
                value: agent.name,
                description: agent.description,
                avatar_url: agent.avatar_url,
                type: 'agent'
            }));
    }

    private getEmojiSuggestions(query: string): IMentions[] {
        // Remove :: caso o usuário tenha digitado junto e converte para lowercase
        const q = query.replace(/^::/, '').toLowerCase().trim();
        if (!q) return []; // se estiver vazio, retorna nada

        return emojiList
            .filter(e =>
                e.value.toLowerCase().startsWith(q) ||  // busca pelo value
                (Array.isArray(e.alias) && e.alias.some(a => a.toLowerCase().includes(q))) // busca pelos aliases
            )
            .map(e => ({
                text: e.text,
                value: e.value,
                description: e.description,
                type: 'emoji'
            }));
    }



    private async handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            await this.handleSend();
            return;
        }
        if (this.mentionActive) {
            const mention = this.mentionSuggestions[this.mentionIndex];
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.mentionIndex = (this.mentionIndex + 1) % this.mentionSuggestions.length;
                this.scrollToActiveMention();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.mentionIndex =
                    (this.mentionIndex - 1 + this.mentionSuggestions.length) % this.mentionSuggestions.length;
                this.scrollToActiveMention();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.selectMention(mention);
            } else if (e.key === 'Enter') {
                if (this.mentionSuggestions.length > 0) {
                    e.preventDefault();
                    this.selectMention(mention);
                }
            }
        }
    }

    private async scrollToActiveMention() {
        if (!this.mentionSuggestionsElement) return;
        await this.updateComplete;

        const activeItem = this.mentionSuggestionsElement.querySelector('li.active') as HTMLElement;
        if (!activeItem) return;

        const containerTop = this.mentionSuggestionsElement.scrollTop;
        const containerBottom = containerTop + this.mentionSuggestionsElement.clientHeight;

        const itemTop = activeItem.offsetTop;
        const itemBottom = itemTop + activeItem.offsetHeight;

        if (itemBottom > containerBottom) {
            this.mentionSuggestionsElement.scrollTop += itemBottom - containerBottom;
        } else if (itemTop < containerTop) {
            this.mentionSuggestionsElement.scrollTop -= containerTop - itemTop;
        }
    }

    private selectMention(suggestion: IMentions) {
        if (!this.textArea || !suggestion) return;

        const cursorPos = this.textArea.selectionStart;
        const beforeCursor = this.text.slice(0, cursorPos);
        const afterCursor = this.text.slice(cursorPos);

        let newText = '';

        switch (suggestion.type) {
            case 'emoji':
                newText = beforeCursor.replace(/::\w*$/, `${suggestion.text} `) + afterCursor;
                break;
            case 'agent':
                newText = beforeCursor.replace(/@{2}[a-zA-Z]*$/, `@@${suggestion.text} `) + afterCursor;
                break;
            case 'user':
                newText = beforeCursor.replace(/@{1}[a-zA-Z]*$/, `@${suggestion.text} `) + afterCursor;
                break;
        }

        this.text = newText;
        this.mentionActive = false;
        this.mentionSuggestions = [];
        this.mentionQuery = '';
        this.mentionIndex = 0;
        this.actualMention = suggestion;

        setTimeout(() => {
            if (!this.textArea) return;
            const newCursorPos = newText.length - afterCursor.length;
            this.textArea.selectionStart = this.textArea.selectionEnd = newCursorPos;
            this.textArea.focus();
        });
    }


    private extractAgentName(text: string): string | undefined {
        const match = text.match(/^@@(\w+)/);
        if (!match) return undefined;
        let value = match[1];
        if (!value.startsWith('agent')) {
            const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
            value = 'agent' + capitalized;
        }
        return value;
    }

    async handleSend() {
        if (!this.text) return;
        let finalText = this.text.trim();
        let isSpecialMention = false;
        let agentName: string | undefined;
        if (this.allUsers.length > 0) {
            const sortedUsers = [...this.allUsers].sort((a, b) => b.name.length - a.name.length);
            sortedUsers.forEach(user => {
                const escapedName = user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(^|\\s)@${escapedName}(?=$|\\s|[.,!?])`, 'g');
                finalText = finalText.replace(regex, `$1[@${user.name}](${user.userId})`);
            });
        }

        if (finalText.startsWith('@@')) {

            const _agentNameTemp = this.extractAgentName(finalText.trim());
            const inList = this.allAgents.find((agent) => (agent.name === _agentNameTemp || agent.alias === _agentNameTemp));
            if (inList) {
                isSpecialMention = true;
                agentName = _agentNameTemp
            }
        }

        if (this.onSend && typeof this.onSend === 'function') {
            this.onSend(finalText, {
                isSpecialMention,
                agentName,
                replyTo: this.replyingTo?.messageId
            });
        }

        this.replyingTo = undefined;
        this.text = '';
        this.adjustTextAreaHeight();
    }
}

interface IMentionAgent {
    name: string,
    description: string,
    alias: string,
    avatar_url?: string,
}
interface IMentions {
    text: string,
    value: string,
    description: string,
    avatar_url?: string | undefined,
    type: 'user' | 'agent' | 'emoji'
}


