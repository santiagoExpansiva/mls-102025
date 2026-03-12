/// <mls fileReference="_102025_/l2/collabMessagesTasks.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { collab_spinner_clock } from '/_102025_/l2/collabMessagesIcons.js';

@customElement('collab-messages-tasks-102025')
export class CollabMessagesTasks extends StateLitElement {

  @state() private view: 'list' | 'details' = 'list';
  @state() private selectedTask: any = null;


  private _backToList() {
    this.view = 'list';
    this.selectedTask = null;
  }

  render() {
    if (this.view === 'list') {
      return this._renderTaskList();
    } else {
      return this._renderTaskDetails();
    }
  }


  private _renderTaskDetails() {
    return html`
      <div class="task-details">
        <button class="back-btn" @click=${this._backToList}>← Voltar</button>
        <h2>${this.selectedTask?.title}</h2>
        <p>In development</p>
      </div>
    `;
  }


  _renderTaskList() {
    return html`
      <div class="task-list-container">

        <!-- Stage: Em Progresso -->
        <div class="task-stage">
          <div class="task-stage-header">
            <span class="stage-name">EM PROGRESSO</span>
            <span class="stage-count">(2)</span>
            <span class="stage-add">+ Adicionar Tarefa</span>
          </div>
          <ul class="task-items">
            <li class="task-row">
              <span class="task-check">${collab_spinner_clock}</span>
              <span class="task-title">Bug explorer</span>
              <span class="task-tag bug">bug</span>
            </li>
            <li class="task-row">
              <span class="task-check">${collab_spinner_clock}</span>
              <span class="task-title">collab messages - ajustes</span>
              <span class="task-meta">3/23</span>
            </li>
          </ul>
        </div>

        <!-- Stage: Review -->
        <div class="task-stage">
          <div class="task-stage-header">
            <span class="stage-name">REVIEW</span>
            <span class="stage-count">(4)</span>
            <span class="stage-add">+ Adicionar Tarefa</span>
          </div>
          <ul class="task-items">
            <li class="task-row" @click=${() => this._openTaskDetails({ id: 1, title: 'Bug add new file' })}>
              <span class="task-check">✔</span>
              <span class="task-title">Bug add new file</span>
            </li>
            <li class="task-row">✔ <span class="task-title">Bug action</span></li>
            <li class="task-row">✔ <span class="task-title">agentImprovePrototype</span></li>
          </ul>
        </div>
        
        <!-- Stage: Pendente -->
        <div class="task-stage">
          <div class="task-stage-header">
            <span class="stage-name">PENDENTE</span>
            <span class="stage-count">(5)</span>
            <span class="stage-add">+ Adicionar Tarefa</span>
          </div>
          <ul class="task-items">
            <li class="task-row">⏳ <span class="task-title">criar widgets de galeria imagens</span></li>
            <li class="task-row">⏳ <span class="task-title">Bug Inicialização</span> <span class="task-tag bug">bug</span></li>
            <li class="task-row">⏳ <span class="task-title">Bug rename com folder</span></li>
            <li class="task-row">⏳ <span class="task-title">Bug import entre projetos</span></li>
            <li class="task-row">⏳ <span class="task-title">collabPreviewL4</span></li>
          </ul>
        </div>

      </div>
    `;
  }

  private _openTaskDetails(task: any) {
    this.selectedTask = task;
    console.info('aq')
    this.view = 'details';
  }

}
