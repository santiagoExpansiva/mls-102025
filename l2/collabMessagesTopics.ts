/// <mls fileReference="_102025_/l2/collabMessagesTopics.ts" enhancement="_100554_enhancementLit" />

import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { collab_chevron_down, collab_chevron_right } from '/_102025_/l2/collabMessagesIcons.js';

@customElement('collab-messages-topics-102025')
export class CollabMessagesTopics extends StateLitElement {

  @state() messages: IMessage[] = [];
  @state() topics: string[] = [];
  @state() expanded = false;
  @property() selectedTopic: string | null = null;

  @property() threadTopics: string[] = [];

  render() {

    this.topics = this.getTopicsFromMessagesOrdered();
    const headerTopics = this.getHeadersTopicsFromMessages();
    const grouped = this.groupTopics(this.topics);

    if (!this.topics || this.topics.length === 0) return html``;

    return html`

      <div class="topics-header">
        <div class="topics">
          <button
            class=${this.selectedTopic === 'all' ? 'active' : ''}
            @click=${() => this.emitTopic('all')}
          >all</button>

          ${!this.expanded
        ? headerTopics.map(topic => html`
                <button
                  class=${this.selectedTopic === topic ? 'active' : ''}
                  @click=${() => this.emitTopic(topic)}
                >${topic.slice(0,15)}</button>
              `)
        : null}
        </div>
        <i class="topics-details" @click=${() => this.expanded = !this.expanded}>
          ${this.expanded ? collab_chevron_down : collab_chevron_right}
        </i>
      </div>

      ${this.expanded ? html`
        <div class="groups">
          ${Object.entries(grouped).map(([group, items]) => html`
            <div class="group">
              <div class="group-title">${group}</div>
              <div class="group-topics">
                ${items.map(item => html`
                  <button
                    class=${this.selectedTopic === item ? 'active' : ''}
                    @click=${() => this.emitTopic(item)}
                  >${item}</button>
                `)}
              </div>
            </div>
          `)}
        </div>
      ` : null}
    `;
  }

  private emitTopic(topic: string) {
    this.selectedTopic = topic;
    this.dispatchEvent(new CustomEvent("topic-selected", {
      detail: { topic },
      bubbles: true,
      composed: true
    }));
  }

  private extractTopics(message: string): string[] {
    const regex = /\+[a-zA-Z0-9_]+/g;
    const matches = message.match(regex);
    return matches ? matches : [];
  }

  private groupTopics(topics: string[]) {
    const groups: Record<string, string[]> = {};
    topics.forEach(topic => {
      const clean = topic.slice(1);
      const [prefix] = clean.split('_', 2);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(topic);
    });
    return groups;
  }

  private getHeadersTopicsFromMessages() {

    const ordered: string[] = [];
    this.messages.forEach((message) => {
      if (message.content) {
        const topics = this.extractTopics(message.content);
        topics.forEach(topic => {
          ordered.push(topic);
        });
      }
    });
    let headerTopics = Array.from(new Set([...ordered])).slice(0, 3);
    
    if (headerTopics.length < 3) {
      const extras = this.threadTopics.filter(
        (topic: string) => !headerTopics.includes(topic)
      );
      headerTopics = [...headerTopics, ...extras].slice(0, 3);
    }

    if (this.selectedTopic && !headerTopics.includes(this.selectedTopic) && this.selectedTopic !== 'all') {
      headerTopics = [...headerTopics, this.selectedTopic];
    }
    return headerTopics;
  }

  private getTopicsFromMessagesOrdered(): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];

    this.messages.forEach((message) => {
      if (message.content) {
        const topics = this.extractTopics(message.content);
        topics.forEach(topic => {
          if (!seen.has(topic) && topic !== '') {
            seen.add(topic);
            ordered.push(topic);
          }
        });
      }
    });

    if (this.threadTopics) {
      this.threadTopics.forEach((thTop) => {
        if (!ordered.find((item) => item == thTop) && thTop !== '') {
          ordered.push(thTop);
        }
      })
    }

    return ordered;
  }
}

interface IMessage extends mls.msg.MessagePerformanceCache {
  context?: mls.msg.ExecutionContext,
}