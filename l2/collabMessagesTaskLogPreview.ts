/// <mls fileReference="_102025_/l2/collabMessagesTaskLogPreview.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { getRootAgent } from '/_100554_/l2/aiAgentHelper.js';
import { IAgent, IAgentAsync } from '/_100554_/l2/aiAgentBase.js';
import { loadAgent } from '/_100554_/l2/aiAgentOrchestration.js';
import { collabImport } from '/_102027_/l2/collabImport.js';

@customElement('collab-messages-task-log-preview-102025')
export class CollabMessagesTaskLogPreview extends StateLitElement {

  @property() task: mls.msg.TaskData | undefined = undefined;
  @property() message: mls.msg.Message | undefined = undefined;


  @state() template?: TemplateResult;

  async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
    window.addEventListener('task-change', this.onTaskChange);
    //this.task = await getTask('20250917143000.1001');
    this.createFeedBack();

  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('task-change', this.onTaskChange);
  }

  render() {
    return html`
    <div>${this.template}</div>`;
  }

  private onTaskChange = async (e: Event) => {
    if (!this.task) return;
    const customEvent = e as CustomEvent;
    const context = customEvent.detail.context;
    const message: mls.msg.Message = context.message;
    const _task: mls.msg.TaskData = context.task;
    if (this.task.PK !== _task.PK) return;
    this.task = _task;
    this.createFeedBack();
  };

  private async createFeedBack() {

    if (!this.task) return;
    const firstAgent = getRootAgent(this.task);
    if (!firstAgent) return;
    const agentName = firstAgent.agentName;
    const agent: IAgent | IAgentAsync | undefined = await loadAgent(agentName);
    if (!agent || !agent.getFeedBack) {
      await collabImport({ folder: '', project: 100554, shortName: 'aiAgentDefaultFeedback', extension: '.ts' })
      this.template = html`<ai-agent-default-feedback-100554 .task=${this.task} .message=${this.message}></ai-agent-default-feedback-100554>`
      return;
    }
    const html2 = await agent.getFeedBack(this.task);
    this.template = html2;
  }
}
