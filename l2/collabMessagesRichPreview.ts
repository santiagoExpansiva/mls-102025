/// <mls fileReference="_102025_/l2/collabMessagesRichPreview.ts" enhancement="_102027_/l2/enhancementLit" />


import { html, unsafeHTML } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import '/_102025_/l2/collabMessagesTextCode.js';

@customElement('collab-messages-rich-preview-102025')
export class WidgetText2CollabMessagesMD extends StateLitElement {

    private _abortController = new AbortController();
    /**
    * Text in standard Slack-style markdown to be rendered as HTML.
    * @example
    * "Olá **mundo**! @lucas #geral"
    */
    @property({ type: String }) text: string = '';
    // Implementation of the abstract members from the base class
    get content(): string | undefined {
        return this.text;
    }
    set content(val: string | undefined) {
        this.text = val ?? '';
    }
    @property({ type: Boolean }) editable?: boolean;

    @property() allHelpers: string[] = ['?help'];

    @property() allCommands: string[] = ['/blockcode'];

    @property() allThreads: mls.msg.Thread[] = [];

    @property() allUsers: mls.msg.User[] = [{ "threads": ["20250417135645.1000", "20250417180232.1000", "20250425212707.1000", "20250521143841.1000", "20250521144214.1000", "20250521144240.1000", "20250507201344.1000", "20250622191652.1000", "20250622191728.1000", "20250622191744.1000", "20250622191802.1000", "20250630112715.1000"], "name": "Wagner", "userId": "20250417004803.1000", "status": "active", "avatar_url": "https://lh6.googleusercontent.com/-Gup9IkqANhQ/AAAAAAAAAAI/AAAAAAAAIFc/38cLYfRcRbg/s96-c/photo.jpg", "notifications": [{ "deviceId": "b00b9875-3cd8-4aff-9336-a7bcc7da60a1", "notificationToken": "fGeAAnHGThySJKRl7PMQZc:APA91bExBHHQ_tKWCUnoqXS1jKCu2Sy91wATIyEvyXjAgCmMC218hXUTtJFJR_UppD_DpEu7-2Pg6mZeWR7K6D5hH_zVOYSza-cHPRVdvCOuoxs_eQDvTFM" }] }, { "avatar_url": "https://lh3.googleusercontent.com/a-/AOh14Gh-DIRLsowx8ItOQ7slQNzEN7geu3YrsG09SFD1=s96-c", "threads": ["20250422203048.1000", "20250521144240.1000", "20250521225840.1000", "20250622191802.1000", "20250622191728.1000", "20250622191744.1000", "20250622191652.1000", "20250630112715.1000"], "name": "Lucas", "userId": "20250521175345.1000", "status": "active", "notifications": [{ "deviceId": "dae7ed77-dc3f-4dd4-b708-3ed8f4f6e451", "notificationToken": "eq-H-0XQXWV_-4REnAdaYz:APA91bGrg1whcXFexHHOVEbQs6knePjlB1YLEGUD0n7sIWctetxHiUHf77Sa6qKw-RO_ynK5TfjAG7B529lS5s3eaX-khmrcCdn4Qt0gNdY5cdyCO9-BWEY" }] }, { "threads": ["20250417135645.1000", "20250417180232.1000", "20250417133813.1000", "20250422203048.1000", "20250425212707.1000", "20250507201344.1000", "20250423205309.1000", "20250521144240.1000", "20250521223250.1000", "20250521225039.1000", "20250521225730.1000", "20250521225840.1000", "20250523200654.1000", "20250622191802.1000", "20250622191728.1000", "20250622191744.1000", "20250622191652.1000", "20250630112715.1000"], "name": "Guilherme Pereira", "userId": "20250417120841.1000", "status": "active", "avatar_url": "https://lh3.googleusercontent.com/a-/AOh14GjhEPN7UazL97l6qFIRIYUoLY-PNNPC93Zw4EVT=s96-c", "notifications": [{ "deviceId": "0f4e5cfe-135b-4cf6-935a-ce6b2e569445", "notificationToken": "cJlbF3VudPLd1VmScOUgFM:APA91bHIWpJQEtUbFqkM1OPao4tN3JIK4kp7MbdlxA_4yZgyxAPlrk6ryAfyIdhIqYELH5xcucGcgRg_HUrF8UHK0V0FdbtWde-OpT3bQo9yMQeN6QAZ5Bc" }] }, { "threads": ["20250417133813.1000", "20250417180232.1000", "20250423205309.1000", "20250425212707.1000", "20250521144240.1000", "20250521225840.1000", "20250622191802.1000", "20250622191728.1000", "20250622191744.1000", "20250622191652.1000", "20250630112715.1000"], "name": "Santiago", "userId": "20250417120844.1000", "status": "active", "avatar_url": "https://lh5.googleusercontent.com/-RcrSZBlS8sM/AAAAAAAAAAI/AAAAAAAAAAc/DQDUXj8XpEo/s96-c/photo.jpg", "notifications": [{ "deviceId": "e97ea0f1-393b-43cc-96bd-00dab1e363bc", "notificationToken": "dsaF5kgcld41tSsB1KTgR4:APA91bFDUCi2R62fkvf56XiW4uZhUsV-_7vlwME62JEGjm1mwAT_ic6RwLRIpvWOTRtErZJFWecOabpnUvP6t326TgTVbT5j73b42_AJ1NhE3KkGuLbeAlE" }] }]

    /**
     * Helper function to extract and protect code blocks (```...```).
     * Now uses <collab-messages-rich-preview-102025> for rendering code blocks.
     */
    private extractCodeBlocks(input: string): { input: string, codeBlocks: string[] } {
        const codeBlocks: string[] = [];

        // Regex atualizado para permitir espaços e código na mesma linha
        input = input.replace(/``` *([a-zA-Z0-9]*)\s*([\s\S]*?)```/g, (_m, lang, code) => {
            const key = `__CODE_BLOCK_${codeBlocks.length}__`;

            // Escape HTML especial dentro do código
            const safeCode = code.replace(/&/g, '&amp;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;');

            // ID único para o botão de copiar
            const codeId = `cb_${Math.random().toString(36).substr(2, 9)}`;

            // Linguagem padrão 'bash' se não especificada
            const language = lang ? lang : 'bash';



            // Adiciona o bloco de código com widget
            codeBlocks.push(`
                <div class="collab-md-codeblock-card">
                <div class="collab-md-codeblock-header">
                    <span class="collab-md-codeblock-lang">${language}</span>
                    <button class="collab-md-codeblock-copy" data-code-id="${codeId}" title="Copiar código" onclick="(function(e){
                    const code = document.getElementById('${codeId}').innerText;
                    if (navigator && navigator.clipboard) { navigator.clipboard.writeText(code); } else { const t=document.createElement('textarea'); t.value=code; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
                    e.target.innerText='Copiado!'; setTimeout(()=>{e.target.innerText='Copiar';},1200);
                    })(event)">Copiar</button>
                </div>
                <collab-messages-rich-preview-102025 class="github" id="${codeId}" language="${language}" text='${safeCode.replace(/\n/g, "&#10;")}'></collab-messages-rich-preview-102025>  
                </div>            
        `);

            return key;
        });

        return { input, codeBlocks };
    }

    /**
    * Helper function to extract and protect inline code (`...`).
    * Now uses <collab-messages-rich-preview-102025> for rendering inline code.
    */
    private extractInlineCodes(input: string): { input: string, inlineCodes: string[] } {
        const inlineCodes: string[] = [];
        // Replace inline code with placeholders and store the HTML using WidgetTextCode
        input = input.replace(/`([^`\n]+)`/g, (_m, code) => {
            const key = `__INLINE_CODE_${inlineCodes.length}__`;
            // Unique id for inline code
            const codeId = `icb_${Math.random().toString(36).substr(2, 9)}`;
            // Escape HTML special chars inside inline code for attribute safety
            const safeCode = code.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            // Use the WidgetTextCode component for inline code, always language="inline"
            inlineCodes.push(`
<span class="collab-md-inlinecode-card">
  <span class="collab-md-inlinecode-header">
    <span class="collab-md-inlinecode-lang">bash</span>
    <button class="collab-md-inlinecode-copy" data-code-id="${codeId}" title="Copiar código" onclick="(function(e){
      const code = document.getElementById('${codeId}').innerText;
      if (navigator && navigator.clipboard) { navigator.clipboard.writeText(code); } else { const t=document.createElement('textarea'); t.value=code; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
      e.target.innerText='Copiado!'; setTimeout(()=>{e.target.innerText='Copiar';},1200);
    })(event)">Copiar</button>
  </span>
  <collab-messages-rich-preview-102025 class="github" language="bash" id="${codeId}" text='${safeCode}' inline></collab-messages-rich-preview-102025>
</span>            
            `
            );
            return key;
        });
        return { input, inlineCodes };
    }

    private parseMentionLinks(input: string): string {
        // @user1
        return input.replace(/\[@([^\]]+)\]\(([^)]+)\)/g, (_m, name, userId) => {
            const user = this.allUsers.find(u => u.userId === userId);
            if (!user) return `[@${name}]`;
            return `<span class="mention" data-user-id="${user.userId}">@${user.name}</span>`;
        });
    }

    private parseChannelRefs(input: string): string {
        // #channel-1
        return input.replace(/#([^\s#.,!?;:]+)/g, (_match, channelName) => {
            const channel = this.allThreads.filter((thr) => thr.name.startsWith('#')).find(c => c.name === '#' + channelName);
            if (!channel) return `#${channelName}`;
            return `<span class="channel-ref">${channel.name}</span>`;
        });
    }

    private parseAgentMentions(input: string): string {
        // @@agent
        return input.replace(/@@([a-zA-Z0-9_]+)/g, (_m, agent) => {
            return `<span class="mention-agent">@@${agent}</span>`;
        });
    }

    private parseCommands(input: string): string {
        return input.replace(/(^|\s)\/(\w+)(?!\/)/g, (match, pre, cmd) => {
            const fullCmd = `/${cmd}`;
            if (this.allCommands.includes(fullCmd)) {
                return `${pre}<span class="command">${fullCmd}</span>`;
            }
            return match;
        });
    }

    private parseObjectRefs(input: string): string {
        // _object → <span class="object-ref">_object</span>
        return input.replace(/\b_([a-zA-Z0-9_]+)\b/g, (_m, obj) => {
            return `<span class="object-ref">_${obj}</span>`;
        });
    }


    private parseHelpRefs(input: string): string {
        // ?ajuda → <span class="help-ref">?ajuda</span>
        return input.replace(/(^|\s)\?([a-zA-Z0-9_]+)(?!=)/g, (match, before, help) => {
            const fullHelp = `?${help}`;
            if (this.allHelpers.includes(fullHelp)) {
                return `${before}<span class="help-ref">${fullHelp}</span>`;
            }
            return match;
        });
    }

    private parseRawLinks2(input: string): string {

        // www.meusite.com/teste http://meusite.com
        return input.replace(
            /\b((https?:\/\/|www\.)[^\s<]+)/gi,
            (_m, url) => {
                const href = url.startsWith("http") ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener">${url}</a>`;
            }
        );
    }

    private parseRawLinks(input: string): string {
        return input.replace(
            /\b((?:https?:\/\/|www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<]*)?)/gi,
            (_m, url) => {
                const href = url.startsWith("http") ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener">${url}</a>`;
            }
        );
    }

    private parseMarkdownLinks(input: string): string {
        // [Texto](https://link.com) → <a href="https://link.com" ...>Texto</a>
        return input.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
            return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
        });
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
    * Parse Slack-style markdown to safe HTML.
    * Order of replacements is important to avoid nested/overlapping tags.
    *
    * Blockquote improvement: blockquote starts with '>' and ends with two newlines or end of text.
    * Now also supports ordered lists (1. Item, 2. Item, ...)
    *
    * Now supports strikethrough using ~~text~~.
    */
    private parseSlackMarkdown(input: string): string {
        if (!input) return '';
        input = input.replace(/<[^>]+>/g, (match) => this.escapeHtml(match));
        // 🔐 Protect code blocks so they are not affected by other markdown replacements
        const codeBlockResult = this.extractCodeBlocks(input);
        input = codeBlockResult.input;
        const codeBlocks = codeBlockResult.codeBlocks;
        // 🔐 Protect inline code so they are not affected by other markdown replacements
        const inlineCodeResult = this.extractInlineCodes(input);
        input = inlineCodeResult.input;
        const inlineCodes = inlineCodeResult.inlineCodes;
        // --- Blockquote improvement ---
        // We want to match blockquotes that start with '>' and continue as long as the next line also starts with '>' or is indented (markdown style),
        // but if the next line does NOT start with '>', it should not be included in the blockquote.
        // We'll process blockquotes before other block-level elements.
        //
        // Implementation: We'll split the input into lines, group consecutive lines starting with '>' as a blockquote, and join the rest as normal text.
        // Split input into lines
        const lines = input.split(/\r?\n/);
        const outputLines: string[] = [];
        let inBlockquote = false;
        let blockquoteLines: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^> ?/.test(line)) {
                // This line is part of a blockquote
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteLines = [];
                }
                // Remove '> ' or '>' from start
                blockquoteLines.push(line.replace(/^> ?/, ''));
            } else {
                // This line is NOT part of a blockquote
                if (inBlockquote) {
                    // End of blockquote, flush it
                    outputLines.push(`<blockquote>${blockquoteLines.join('<br>')}</blockquote>`);
                    inBlockquote = false;
                    blockquoteLines = [];
                }
                outputLines.push(line);
            }
        }
        // If ended in a blockquote, flush it
        if (inBlockquote) {
            outputLines.push(`<blockquote>${blockquoteLines.join('<br>')}</blockquote>`);
        }
        input = outputLines.join('\n');
        // --- Ordered lists (numbered lists) ---
        // This block will match consecutive lines starting with "1. ...", "2. ..." etc, and wrap them in <ol>...</ol>
        // We process ordered lists before unordered lists to avoid conflicts.
        //
        // Implementation: Use a regex to match blocks of lines that start with a number and a dot, then process each block.
        input = input.replace(/((?:^\d+\. .*(?:\n|$))+)/gm, (m) => {
            // Split block into lines
            const items = m.trim().split(/\n/).map(line => {
                const match = /^\d+\. (.*)/.exec(line);
                return match ? `<li>${match[1]}</li>` : '';
            }).filter(Boolean);
            // Only return <ol> if at least one item found
            return items.length ? `<ol>${items.join('')}</ol>` : m;
        });
        // --- Unordered lists ---
        input = input.replace(/((?:^- .*(?:\n|$))+)/gm, (m) => {
            const items = m.trim().split(/\n/).map(line => {
                const match = /^- (.*)/.exec(line);
                return match ? `<li>${match[1]}</li>` : '';
            }).filter(Boolean);
            return items.length ? `<ul>${items.join('')}</ul>` : m;
        });
        // Bold
        input = input.replace(/\*\*([^*]+)\*\*/g, (_m, bold) => `<strong>${bold}</strong>`);
        // Italic
        input = input.replace(/(^|\s)_([^_\s][^_]*?)_(?=\s|$)/g, (_m, pre, italic) => `${pre}<em>${italic}</em>`);
        // Strikethrough (tachado) - NEW FEATURE
        // This regex matches ~~text~~ and wraps it in <del>...</del>
        // We do this after code blocks and inline code are protected
        input = input.replace(/~~([^~]+)~~/g, (_m, striked) => `<del>${striked}</del>`);
        // Mentions and commands
        // input = this.parseMentions(input);
        input = this.parseChannelRefs(input);
        input = this.parseCommands(input)
        input = this.parseAgentMentions(input);
        input = this.parseObjectRefs(input);
        input = this.parseHelpRefs(input);
        input = this.parseMentionLinks(input);
        input = this.parseMarkdownLinks(input);
        input = this.parseRawLinks(input);

        // 🚫 Do NOT escape <, >, & here — this would break the generated HTML
        // Convert line breaks
        input = input.replace(/\n/g, '<br>');
        // Restore protected code blocks
        codeBlocks.forEach((html, i) => {
            input = input.replace(`__CODE_BLOCK_${i}__`, html);
        });
        inlineCodes.forEach((html, i) => {
            input = input.replace(`__INLINE_CODE_${i}__`, html);
        });
        return input;
    }
    render() {
        return html`<div class="collab-md-message">${unsafeHTML(this.parseSlackMarkdown(this.text))}</div>`;
    }

    private attachDynamicEvents() {
        this._abortController.abort(); // limpa eventos anteriores
        this._abortController = new AbortController();

        const emit = (el: Element, type: string) => {
            const value = el.textContent?.trim().replace(/^[@#/?]+/, ''); // remove prefixos
            el.dispatchEvent(new CustomEvent(type, {
                detail: { value, element: el },
                bubbles: true,
                composed: true,
            }));
        };

        const eventMap: { selector: string, base: string }[] = [
            { selector: '.mention', base: 'mention' },
            { selector: '.channel-ref', base: 'channel' },
            { selector: '.command', base: 'command' },
            { selector: '.help-ref', base: 'help' },
            { selector: '.mention-agent', base: 'mention-agent' },
        ];

        eventMap.forEach(({ selector, base }) => {
            this.renderRoot.querySelectorAll(selector).forEach(el => {
                let hoverTimeout: number | undefined;

                el.addEventListener('mouseover', (e) => {
                    e.stopPropagation();
                    hoverTimeout = window.setTimeout(() => {
                        emit(el, `${base}-hover`);
                    }, 500);
                }, { signal: this._abortController.signal });

                el.addEventListener('mouseout', () => {
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        hoverTimeout = undefined;
                    }
                }, { signal: this._abortController.signal });

                //     el.addEventListener('mouseover', (e) => { e.stopPropagation(); emit(el, `${base}-hover`), { signal: this._abortController.signal }; });
                el.addEventListener('click', (e) => { e.preventDefault(); emit(el, `${base}-click`), { signal: this._abortController.signal } });
            });
        });
    }
    updated() {
        this.attachDynamicEvents();
    }
    disconnectedCallback() {
        this._abortController.abort();
        super.disconnectedCallback();
    }
}
