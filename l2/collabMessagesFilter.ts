/// <mls fileReference="_102025_/l2/collabMessagesFilter.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, classMap } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { collab_magnifying_glass } from '/_102025_/l2/collabMessagesIcons.js'

@customElement('collab-messages-filter-102025')
export class CollabMessagesFilter extends StateLitElement {
    @property({ reflect: true }) private expanded = false;
    @property() private query = '';

    @property() placeholder: string = '';

    private toggleExpand(e: MouseEvent) {

        if ((e.target as HTMLElement).closest('input')) return;

        if (this.expanded) {

            this.expanded = false;
            this.query = '';
        } else {

            this.expanded = true;
            setTimeout(() => {
                const input = this.querySelector('input');
                input?.focus();
            }, 100);
        }
    }

    private handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            this.expanded = false;
            this.query = '';
        }
    }

    private handleInput(e: InputEvent) {
        const target = e.target as HTMLInputElement;
        this.query = target.value;

        this.dispatchEvent(new CustomEvent('search-change', {
            detail: this.query,
            bubbles: true,
            composed: true
        }));
    }


    render() {
        return html`
			<div @click=${this.toggleExpand} class=${classMap({ container: true, expanded: this.expanded })}>
				<button
					class="icon"
					
					title=${this.expanded ? 'Fechar pesquisa' : 'Buscar'}
				>
					<span>${collab_magnifying_glass}</span>
				</button>

				<input
					type="text"
					placeholder=${this.placeholder}
					.value=${this.query}
					@input=${this.handleInput}
	                @keydown=${this.handleKey}
				/>
			</div>
		`;
    }

}

