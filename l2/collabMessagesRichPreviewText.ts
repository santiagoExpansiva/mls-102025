/// <mls fileReference="_102025_/l2/collabMessagesRichPreviewText.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import '/_102025_/l2/collabMessagesTextCode.js';

export type SlackToken =
    | { type: 'text'; value: string }
    | { type: 'inline-code'; value: string }
    | { type: 'code-block'; language: string; value: string }
    | { type: 'bold'; value: string }
    | { type: 'italic'; value: string }
    | { type: 'strike'; value: string }
    | { type: 'mention'; value: string; userId: string }
    | { type: 'channel'; value: string }
    | { type: 'agent'; value: string }
    | { type: 'command'; value: string }
    | { type: 'help'; value: string }
    | { type: 'link'; text: string; url: string }
    | { type: 'raw-link'; url: string }
    | { type: 'blockquote'; children: SlackToken[] }
    | { type: 'list'; ordered: boolean; items: SlackToken[][] };

type ParserState = 'NORMAL' | 'INLINE_CODE' | 'CODE_BLOCK';

/// **collab_i18n_start**
const message_pt = {
    loading: 'Carregando...',
    copy: 'Copiar',
    copied: 'Copiado',
}

const message_en = {
    loading: 'Loading...',
    copy: 'Copy',
    copied: 'Copied',
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**


@customElement('collab-messages-rich-preview-text-102025')
export class CollabMessagesRichPreviewText102025 extends StateLitElement {

    private msg: MessageType = messages['en'];

    @property() allHelpers: string[] = ['?help'];

    @property() allCommands: string[] = ['/command1'];

    @property() allThreads: mls.msg.Thread[] = [];

    @property() allUsers: mls.msg.User[] = [];

    @property({ type: String }) text = ``;

    render() {
        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        const tokens = this.parseSlackMarkdown(this.text);
        return this.renderSlackTokens(tokens);
    }


    private renderSlackTokens(tokens: SlackToken[]): any {
        return html`${tokens.map(token => this.renderToken(token))}`;
    }

    private renderToken(token: SlackToken) {
        switch (token.type) {
            case 'text': return this.renderText(token);
            case 'bold': return this.renderBold(token);
            case 'italic': return this.renderItalic(token);
            case 'strike': return this.renderStrike(token);
            case 'inline-code': return this.renderInlineCode(token);
            case 'code-block': return this.renderCodeBlock(token);
            case 'mention': return this.renderMention(token);
            case 'agent': return this.renderAgent(token);
            case 'channel': return this.renderChannel(token);
            case 'command': return this.renderCommand(token);
            case 'help': return this.renderHelp(token);
            case 'link': return this.renderLink(token);
            case 'raw-link': return this.renderRawLink(token);
            case 'blockquote': return this.renderBlockquote(token);
            case 'list': return this.renderList(token);
            default: return html``;
        }
    }

    private renderText(token: { value: string }) {
        const parts = token.value.split('\n');
        return html`
            ${parts.map((part, index) =>
            index === 0
                ? html`${part}`
                : html`<br />${part}`
        )}
        `;
    }

    private renderBold(token: { value: string }) {
        return html`<strong>${token.value}</strong>`;
    }

    private renderItalic(token: { value: string }) {
        return html`<em>${token.value}</em>`;
    }

    private renderStrike(token: { value: string }) {
        return html`<del>${token.value}</del>`;
    }

    private renderInlineCode(token: { value: string }) {
        return html`<code class="inline-code">${token.value}</code>`;
    }

    private renderCodeBlock(token: { language: string; value: string }) {
        return html`
            <div class="collab-md-codeblock-card">
            <div class="collab-md-codeblock-header">
                <span class="collab-md-codeblock-lang">${token.language}</span>
                <button
                class="collab-md-codeblock-copy"
                title="Copiar código"
                @click=${(e: MouseEvent) => this.copyToClipboard(e, token.value)}
                >
                ${this.msg.copy}
                </button>
            </div>

            <collab-messages-text-code-102025
                language="${token.language}"
                .text="${token.value}">
            </collab-messages-text-code-102025>
            </div>
        `;
    }

    private renderAgent(token: { value: string }) {
        return html`
            <span
            class="mention-agent"
            data-agent="${token.value}"
            >
            @@${token.value}
            </span>
        `;
    }

    private renderMention(token: { value: string }) {
        const user = this.allUsers?.find(
            u => u.name.toLowerCase() === token.value.toLowerCase()
        );

        const isValid = Boolean(user);

        return html`
            <span
            class="mention ${isValid ? 'mention--valid' : 'mention--invalid'}"
            data-user-id="${user?.userId ?? ''}"
            data-username="${token.value}"

            @click=${(e: MouseEvent) => {
                if (!isValid) return;
                this.dispatchEvent(new CustomEvent('mention-click', {
                    detail: { userId: user!.userId, element: e.target },
                    bubbles: true,
                    composed: true,
                }));
            }}

            @mouseenter=${(e: MouseEvent) => {
                if (!isValid) return;
                this.dispatchEvent(new CustomEvent('mention-hover', {
                    detail: { userId: user!.userId, element: e.target },
                    bubbles: true,
                    composed: true,
                }));
            }}

            @mouseleave=${(e: MouseEvent) => {
                if (!isValid) return;
                this.dispatchEvent(new CustomEvent('mention-leave', {
                    detail: { userId: user!.userId, element: e.target },
                    bubbles: true,
                    composed: true,
                }));
            }}
            >
            @${token.value}
            </span>
        `;
    }

    private renderChannel(token: { value: string }) {
        const channelName = `#${token.value}`;

        const thread = this.allThreads?.find(
            t => t.name === channelName
        );

        const isValid = Boolean(thread);

        return html`
            <span
            class="channel ${isValid ? 'channel--valid' : 'channel--invalid'}"
            data-channel="${token.value}"
            data-thread-id="${thread?.threadId ?? ''}"

            @click=${(ev: MouseEvent) => {
                if (!isValid) return;

                this.dispatchEvent(
                    new CustomEvent('channel-click', {
                        detail: { threadId: thread!.threadId, element: ev.target },
                        bubbles: true,
                        composed: true,
                    })
                );
            }}

            @mouseenter=${(ev: MouseEvent) => {
                if (!isValid) return;

                this.dispatchEvent(
                    new CustomEvent('channel-hover', {
                        detail: { threadId: thread!.threadId, element: ev.target },
                        bubbles: true,
                        composed: true,
                    })
                );
            }}

            @mouseleave=${(ev: MouseEvent) => {
                if (!isValid) return;

                this.dispatchEvent(
                    new CustomEvent('channel-leave', {
                        detail: { threadId: thread!.threadId, element: ev.target },
                        bubbles: true,
                        composed: true,
                    })
                );
            }}
            >
            #${token.value}
            </span>
        `;
    }


    private renderCommand(token: { value: string }) {
        const fullCommand = `/${token.value}`;
        const isValid = this.allCommands?.includes(fullCommand);

        return html`
            <span
            class="command ${isValid ? 'command--valid' : 'command--invalid'}"
            data-command="${token.value}"
            @click=${() => {
                if (!isValid) return;
                this.dispatchEvent(new CustomEvent('command-click', {
                    detail: { command: token.value },
                    bubbles: true,
                    composed: true,
                }));
            }}
            >
            ${fullCommand}
            </span>
        `;
    }

    private renderHelp(token: { value: string }) {
        const full = `?${token.value}`;
        const isValid = this.allHelpers?.includes(full);

        return html`
            <span
            class="help ${isValid ? 'help--valid' : 'help--invalid'}"
            data-help="${token.value}"
            >
            ${full}
            </span>
        `;
    }

    private renderLink(token: { text: string; url: string }) {
        return html`
            <a href="${token.url}" target="_blank" rel="noopener">
            ${token.text}
            </a>
        `;
    }

    private renderRawLink(token: { url: string }) {
        const href = token.url.startsWith('http')
            ? token.url
            : `https://${token.url}`;

        return html`
            <a href="${href}" target="_blank" rel="noopener">
            ${token.url}
            </a>
        `;
    }

    private renderBlockquote(token: { children: SlackToken[] }) {
        return html`
            <blockquote>
            ${this.renderSlackTokens(token.children)}
            </blockquote>
        `;
    }

    private renderList(token: { ordered: boolean; items: SlackToken[][] }) {
        return token.ordered
            ? html`
                <ol>
                ${token.items.map(
                item => html`<li>${this.renderSlackTokens(item)}</li>`
            )}
                </ol>
            `
            : html`
                <ul>
                ${token.items.map(
                item => html`<li>${this.renderSlackTokens(item)}</li>`
            )}
                </ul>
            `;
    }

    private copyToClipboard(e: MouseEvent, code: string) {
        if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(code);
        } else {
            const t = document.createElement('textarea');
            t.value = code; document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
        }

        if (e.target) (e.target as HTMLElement).innerText = `${this.msg.copied}!`; setTimeout(() => { (e.target as HTMLElement).innerText = `${this.msg.copy}`; }, 1200);
    }

    private parseSlackMarkdown(input: string): SlackToken[] {
        const tokens: SlackToken[] = [];
        const lines = input.split(/\r?\n/);

        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            /* ───── CODE BLOCK (delegado ao inline parser) ───── */
            if (line.startsWith('```')) {
                // junta tudo até fechar ```
                let block = line + '\n';
                i++;

                while (i < lines.length && !lines[i].startsWith('```')) {
                    block += lines[i] + '\n';
                    i++;
                }

                if (i < lines.length) {
                    block += lines[i];
                    i++;
                }

                tokens.push(...this.parseInlineSlackMarkdown(block));
                continue;
            }

            /* ───── BLOCKQUOTE ───── */
            if (line.startsWith('>')) {
                const quoteLines: string[] = [];

                while (i < lines.length && lines[i].startsWith('>')) {
                    quoteLines.push(lines[i].replace(/^>\s?/, ''));
                    i++;
                }

                tokens.push({
                    type: 'blockquote',
                    children: this.parseSlackMarkdown(quoteLines.join('\n')),
                });

                continue;
            }

            /* ───── UNORDERED LIST ───── */
            if (/^- /.test(line)) {
                const items: SlackToken[][] = [];

                while (i < lines.length && /^- /.test(lines[i])) {
                    items.push(
                        this.parseInlineSlackMarkdown(
                            lines[i].replace(/^- /, '')
                        )
                    );
                    i++;
                }

                tokens.push({
                    type: 'list',
                    ordered: false,
                    items,
                });

                continue;
            }

            /* ───── ORDERED LIST ───── */
            if (/^\d+\. /.test(line)) {
                const items: SlackToken[][] = [];

                while (i < lines.length && /^\d+\. /.test(lines[i])) {
                    items.push(
                        this.parseInlineSlackMarkdown(
                            lines[i].replace(/^\d+\. /, '')
                        )
                    );
                    i++;
                }

                tokens.push({
                    type: 'list',
                    ordered: true,
                    items,
                });

                continue;
            }

            /* ───── NORMAL LINE ───── */
            if (line !== '') {
                tokens.push(...this.parseInlineSlackMarkdown(line));
            }

            tokens.push({ type: 'text', value: '\n' });
            i++;
        }

        return tokens;
    }


    private parseInlineSlackMarkdown(input: string): SlackToken[] {
        const tokens: SlackToken[] = [];

        let state: ParserState = 'NORMAL';
        let buffer = '';
        let codeLang = '';

        let i = 0;

        const matchRawLink = (s: string) =>
            s.match(/^(https?:\/\/[^\s]+|www\.[^\s]+)/);

        const flushText = () => {
            if (buffer) {
                tokens.push({ type: 'text', value: buffer });
                buffer = '';
            }
        };

        const isBoundary = (char?: string) =>
            !char || /\s/.test(char);

        while (i < input.length) {

            /* ───────────── CODE BLOCK START ───────────── */
            if (state === 'NORMAL' && input.startsWith('```', i)) {
                flushText();
                i += 3;

                while (i < input.length && input[i] !== '\n') {
                    codeLang += input[i++];
                }
                if (input[i] === '\n') i++;

                state = 'CODE_BLOCK';
                buffer = '';
                continue;
            }

            /* ───────────── CODE BLOCK END ───────────── */
            if (state === 'CODE_BLOCK' && input.startsWith('```', i)) {
                tokens.push({
                    type: 'code-block',
                    language: codeLang.trim() || 'plain',
                    value: buffer,
                });
                buffer = '';
                codeLang = '';
                state = 'NORMAL';
                i += 3;
                continue;
            }

            /* ───────────── INLINE CODE ───────────── */
            if (state === 'NORMAL' && input[i] === '`') {
                flushText();
                state = 'INLINE_CODE';
                buffer = '';
                i++;
                continue;
            }

            if (state === 'INLINE_CODE' && input[i] === '`') {
                tokens.push({ type: 'inline-code', value: buffer });
                buffer = '';
                state = 'NORMAL';
                i++;
                continue;
            }

            /* ───────────── FORMATTING (NORMAL ONLY) ───────────── */
            if (state === 'NORMAL') {

                // bold **
                if (input.startsWith('**', i)) {
                    const end = input.indexOf('**', i + 2);
                    if (end !== -1) {
                        flushText();
                        tokens.push({
                            type: 'bold',
                            value: input.slice(i + 2, end),
                        });
                        i = end + 2;
                        continue;
                    }
                }

                // strike ~~
                if (input.startsWith('~~', i)) {
                    const end = input.indexOf('~~', i + 2);
                    if (end !== -1) {
                        flushText();
                        tokens.push({
                            type: 'strike',
                            value: input.slice(i + 2, end),
                        });
                        i = end + 2;
                        continue;
                    }
                }

                // italic _
                if (input[i] === '_') {
                    const end = input.indexOf('_', i + 1);
                    if (end !== -1) {
                        flushText();
                        tokens.push({
                            type: 'italic',
                            value: input.slice(i + 1, end),
                        });
                        i = end + 1;
                        continue;
                    }
                }

                
                // agent @@agent
                if (
                    state === 'NORMAL' &&
                    input[i] === '@' &&
                    input[i + 1] === '@' &&
                    isBoundary(input[i - 1])
                ) {
                    const match = input.slice(i + 2).match(/^[a-zA-Z0-9_-]+/);
                    if (match) {
                        flushText();
                        tokens.push({
                            type: 'agent',
                            value: match[0],
                        });
                        i += match[0].length + 2;
                        continue;
                    }
                }

                // mention markdown [@Name](userId)
                if (input[i] === '[' && input[i + 1] === '@') {
                    const closeText = input.indexOf(']', i + 2);
                    const openParen = input[closeText + 1] === '(' ? closeText + 1 : -1;
                    const closeParen = openParen !== -1
                        ? input.indexOf(')', openParen + 1)
                        : -1;

                    if (closeText !== -1 && openParen !== -1 && closeParen !== -1) {
                        flushText();

                        const name = input.slice(i + 2, closeText); // remove [@
                        const userId = input.slice(openParen + 1, closeParen);

                        tokens.push({
                            type: 'mention',
                            value: name,
                            userId,
                        });

                        i = closeParen + 1;
                        continue;
                    }
                }

                // channel #
                if (input[i] === '#' && isBoundary(input[i - 1])) {
                    const match = input.slice(i + 1).match(/^[a-zA-Z0-9_-]+/);
                    if (match) {
                        flushText();
                        tokens.push({
                            type: 'channel',
                            value: match[0],
                        });
                        i += match[0].length + 1;
                        continue;
                    }
                }

                // command /
                if (input[i] === '/' && isBoundary(input[i - 1])) {
                    const match = input.slice(i + 1).match(/^[a-zA-Z0-9_-]+/);
                    if (match) {
                        flushText();
                        tokens.push({
                            type: 'command',
                            value: match[0], // sem a barra
                        });
                        i += match[0].length + 1;
                        continue;
                    }
                }

                // help ?
                if (input[i] === '?' && isBoundary(input[i - 1])) {
                    const match = input.slice(i + 1).match(/^[a-zA-Z0-9_-]+/);
                    if (match) {
                        flushText();
                        tokens.push({ type: 'help', value: match[0] });
                        i += match[0].length + 1;
                        continue;
                    }
                }

                // markdown link [text](url)
                if (state === 'NORMAL' && input[i] === '[') {
                    const closeText = input.indexOf(']', i + 1);
                    const openParen = input[closeText + 1] === '(' ? closeText + 1 : -1;
                    const closeParen = openParen !== -1 ? input.indexOf(')', openParen + 1) : -1;

                    if (closeText !== -1 && openParen !== -1 && closeParen !== -1) {
                        flushText();
                        const text = input.slice(i + 1, closeText);
                        const url = input.slice(openParen + 1, closeParen);
                        tokens.push({ type: 'link', text, url });
                        i = closeParen + 1;
                        continue;
                    }
                }

                // raw link
                if (state === 'NORMAL' && isBoundary(input[i - 1])) {
                    const match = matchRawLink(input.slice(i));
                    if (match) {
                        flushText();
                        const url = match[0];
                        tokens.push({ type: 'raw-link', url });
                        i += url.length;
                        continue;
                    }
                }


            }

            /* ───────────── DEFAULT CHAR ───────────── */
            buffer += input[i];
            i++;
        }

        /* ───────────── FLUSH ───────────── */
        if (buffer) {
            if (state === 'INLINE_CODE') {
                tokens.push({ type: 'text', value: '`' + buffer });
            } else if (state === 'CODE_BLOCK') {
                tokens.push({
                    type: 'code-block',
                    language: codeLang.trim() || 'plain',
                    value: buffer,
                });
            } else {
                tokens.push({ type: 'text', value: buffer });
            }
        }

        return tokens;
    }

}
