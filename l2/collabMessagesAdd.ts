/// <mls fileReference="_102025_/l2/collabMessagesAdd.ts" enhancement="_102027_/l2/enhancementLit" />

import { html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { notifyThreadChange, notifyThreadCreate, getTemporaryContext } from '/_100554_/l2/aiAgentHelper.js';
import { loadAgent, executeBeforePrompt } from '/_100554_/l2/aiAgentOrchestration.js';
import { IAgent } from '/_100554_/l2/aiAgentBase.js'
import { addThread, updateThread } from '/_102025_/l2/collabMessagesIndexedDB.js';
import { getUserId, getDmThreadByUsers, addMessage, createThreadDM } from '/_102025_/l2/collabMessagesHelper.js';

import { CollabMessagesInputTag } from '/_102025_/l2/collabMessagesInputTag.js';
import '/_102025_/l2/collabMessagesInputTag.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    threadType: 'Tipo de thread',
    threadName: 'Nome da thread',
    dmUser: 'Usuário (DM)',
    channelTemplate: 'Template do canal',
    visibility: 'Visibilidade',
    visibilityPublic: 'Pública',
    visibilityPrivate: 'Privada',
    visibilityCompany: 'Empresa',
    visibilityTeam: 'Time',
    group: 'Grupo',
    languages: 'Tradução automática nos idiomas',
    languagesHint: 'A cada mensagem será verificado o idioma da mensagem e feito a tradução para os idiomas acima, deixe em branco para não gastar créditos.',
    validateFormError: 'Preencha todos os campos obrigatórios.',
    userError: 'ID de usuário inválido.',
    btnAdd: 'Adicionar',
    advanced: 'Configurações avançadas',
    successSaving: 'Alterações salvas com sucesso!',
    dmValidationError: "Usuário inválido",
    channelValidationError: "O nome do canal deve começar com '#'.",
    selectAgent: 'Escolha um AgentBot (opcional)',
    noneAgent: 'Nenhum – Sem agente automático',
    initialMessage: 'Mensagem inicial (opcional)',
    placeholderMessage: 'Escreva aqui uma mensagem de abertura...',
    suggestions: ['Mensagem de boas-vindas', 'Regras do canal', 'Links de ajuda'],
    topics: 'Tópicos iniciais',
    agentConfig: 'Configuração do agente',
    placeholderConfig: 'Explique como o agente deve funcionar...',
    back: 'Voltar',
    save: 'Salvar Detalhes',
    threadDmAlreadyExist: 'Já existe uma conversa direta com este usuário.',
    placeholderMessageAvatar: 'Digite aqui sua descrição..',
    avatarUrl: 'Gerar avatar com IA (opcional)',
    detailsBot: 'Instalar bot ',
    detailsInitialMessage: 'Configurar mensagem inicial',
    detailsIcon: 'Configurar ícone',
    threadNameInvalid: 'O nome deve começar com #',
    selectUser: 'Selecione um usuário',
    dmDesc: 'Converse privadamente com apenas uma pessoa.',
    channelDesc: 'Crie um espaço para discutir tópicos com várias pessoas.'
}

const message_en = {
    loading: 'Loading...',
    threadType: 'Thread type',
    threadName: 'Thread name',
    dmUser: 'User (DM)',
    channelTemplate: 'Channel template',
    visibility: 'Visibility',
    visibilityPublic: 'Public',
    visibilityPrivate: 'Private',
    visibilityCompany: 'Company',
    visibilityTeam: 'Team',
    group: 'Group',
    languages: 'Automatic translation in multiple languages',
    languagesHint: 'For each message, the language will be detected and translated into the languages above. Leave blank to avoid spending credits.',
    validateFormError: 'Please fill in all required fields.',
    userError: 'Invalid user ID.',
    advanced: 'Advanced settings',
    btnAdd: 'Add',
    successSaving: 'Saved successfully!',
    dmValidationError: "Invalid user",
    channelValidationError: "Channel name must start with '#'.",
    selectAgent: 'Select an AgentBot (opcional)',
    noneAgent: 'None – No automatic agent',
    initialMessage: 'Initial message (optional)',
    placeholderMessage: 'Write an opening message here...',
    suggestions: ['Welcome message', 'Rules', 'Help links'],
    topics: 'Initial topics',
    agentConfig: 'Agent configuration',
    placeholderConfig: 'Explain how the agent should work...',
    back: 'Back',
    save: 'Save Details',
    threadDmAlreadyExist: 'A direct message thread with this user already exists.',
    placeholderMessageAvatar: "Type your description here...",
    avatarUrl: 'Generate avatar with AI (opcional)',
    detailsBot: 'Install bot',
    detailsInitialMessage: 'Set up initial message',
    detailsIcon: 'Set up icon',
    threadNameInvalid: 'The name must start with #',
    selectUser: 'Select a user',
    dmDesc: 'Chat privately with just one person.',
    channelDesc: 'Create a space to discuss topics with multiple people.'
}


type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

type ThreadType = 'dm' | 'channel';

const agentName = 'agentGenerateAvatarSvg';

@customElement('collab-messages-add-102025')
export class CollabMessagesAdd extends StateLitElement {

    private msg: MessageType = messages['en'];

    @state() private threadType: ThreadType = 'dm';
    @state() private threadName: string = '';
    @state() private visibility: mls.msg.ThreadVisibility = 'private';
    @state() private group: mls.msg.ThreadGroup = 'CRM';
    @state() private languages: string[] = [];
    @state() private isLoading: boolean = false;
    @state() private dmUser: string = ''
    @state() private users: {
        userId: string;
        name: string;
    }[] = [];

    @state() agentsBots: IAgentsBots[] = [];
    @state() _selectedAgent: string = 'none';
    @state() _initialMessage: string = '';
    @state() _topics: string[] = [];
    @state() _agentConfig: string = '';
    @state() _promptToAvatar: string = '';

    @property() labelOk: string = '';
    @property() labelError: string = '';
    @property() userId: string | undefined;

    @query('#languageInput') languageInput?: CollabMessagesInputTag;

    onAddSuccess: Function | undefined;

    async firstUpdated(_changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(_changedProperties);
        await this.loadUsersAvaliables();
        await this.loadAgentsBotsAvaliables();
    }

    render() {
        return this._renderAdd();
    }

    private async loadUsersAvaliables() {
        const userId = getUserId();
        if (!userId) return;
        const res = await mls.api.msgGetUsers({ status: "active", prefixName: "", userId });
        if (res.statusCode !== 200) return;
        this.users = res.users.filter((user) => user.userId !== userId);
    }

    private async loadAgentsBotsAvaliables() {

        const agentsFiles = await this.getAgentsFiles();
        const agents = agentsFiles.map((data: IAgentsList) => {
            const { visibility, agentName, avatar_url, agentDescription, scope } = data.agent;
            const { project, folder, shortName } = data.storFile;

            if (agentName.startsWith('agentBot') && agentName !== 'agentBotInstall' && visibility === 'public') {
                return {
                    id: agentName, name: agentName, description: agentDescription, avatar_url: avatar_url, info: { project, folder, shortName }
                }
            }


        }).filter((item) => item !== undefined);

        this.agentsBots = [{ id: 'none', name: '', description: '', avatar_url: '' }].concat(agents as IAgentsBots[]);

    }

    private async getAgentsFiles(): Promise<IAgentsList[]> {
        const keys = Object.keys(mls.stor.files);
        const ret: IAgentsList[] = [];
        for await (const k of keys) {
            if (k.indexOf('agent') < 0) continue;
            const storFile = mls.stor.files[k];
            const path = storFile.folder ? `/_${storFile.project}_/l2/${storFile.folder}/${storFile.shortName}` : `/_${storFile.project}_/l2/${storFile.shortName}`;
            if (storFile.extension !== '.ts' || !storFile.shortName.startsWith('agent')) continue;
            try {
                const mdl = await import(path);
                if (!mdl.createAgent) continue;
                const agent = mdl.createAgent() as IAgent
                ret.push({ agent, storFile });
            } catch (err) {
                continue;
            }
        }
        return ret;
    }

    private _renderAdd() {
        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];

        return html`
        <div class="section-add-thread">

             <div class="selector-container form-group">
                <label >${this.msg.threadType}</label>
                
                <div class="radio-group">
                
                <label class="radio-label ${this.threadType === 'dm' ? 'selected' : ''}">
                    <input 
                        type="radio" 
                        name="threadType" 
                        value="dm" 
                        class="radio-input"
                        .checked=${this.threadType === 'dm'}
                        @change=${this._handleChange}
                    >
                    <div class="content-wrapper">

                        <div class="option-title">
                            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            <span>DM</span>
                        </div>
                        <div class="option-desc">
                            ${this.msg.dmDesc}
                        </div>                        
                    </div>
                </label>

                <!-- Opção Channel -->
                <label class="radio-label ${this.threadType === 'channel' ? 'selected' : ''}">
                    <input 
                        type="radio" 
                        name="threadType" 
                        value="channel" 
                        class="radio-input"
                        .checked=${this.threadType === 'channel'}
                        @change=${this._handleChange}
                    >
                    <div class="content-wrapper">
                    
                        <div class="option-title">
                            <svg viewBox="0 0 24 24"><path d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4zm-6 4h-4v-4h4v4z"/></svg>
                            <span>Channel</span>
                        </div>
                        <div class="option-desc">
                            ${this.msg.channelDesc}
                        </div>
                    </div>
                    
                </label>

                </div>
            </div>


            ${this.threadType === 'dm' ? html`
                <div class="form-group">
                    <label> ${this.msg.dmUser} </label>
                    <select
                        .value=${this.dmUser}
                        @change=${(e: Event) => this.dmUser = (e.target as HTMLSelectElement).value}>
                        <option value="" disabled selected>${this.msg.selectUser}</option>
                        ${this.users.map(user => html`
                            <option value="${user.userId}">@${user.name}</option>
                        `)}
                    </select>
                </div>

                
            ` : ''}

            ${this.threadType === 'channel' ? html`
                <div class="form-group">
                    <label>${this.msg.threadName} </label>
                    <input type="text" placeholder="#nome-do-canal"
                        .value=${this.threadName}
                            pattern="^#.*"
                        @input=${(e: Event) => this.threadName = (e.target as HTMLInputElement).value}
                    >
                    <span class="field-thread-name-error">${this.msg.threadNameInvalid}</span>
                </div>

                
            ` : ''}

            ${this.threadType === 'channel' ? html`
                <div class="form-group">
                    <label> ${this.msg.visibility} </label>   
                    <select name="visibility" required
                        .value=${this.visibility}
                        @change=${(e: Event) => this.visibility = (e.target as HTMLSelectElement).value as mls.msg.ThreadVisibility}>
                        <option value="public">${this.msg.visibilityPublic}</option>
                        <option value="private">${this.msg.visibilityPrivate}</option>
                        <option value="company">${this.msg.visibilityCompany}</option>
                        <option value="team">${this.msg.visibilityTeam}</option>
                    </select>
                </div>
                         
            `: ''}
            <div class="form-group">
                <label> ${this.msg.group}</label>
                    <select name="group" required
                        .value=${this.group}
                        @change=${(e: Event) => this.group = (e.target as HTMLSelectElement).value as mls.msg.ThreadGroup}>
                        <option value="CRM">CRM</option>
                        <option value="TASK">TASK</option>
                        <option value="DOCS">DOCS</option>
                        <option value="CONNECT">CONNECT</option>
                        <option value="APPS">APPS</option>
                    </select>
            </div>

            <div class="form-group">
                <label> ${this.msg.languages}</label>
                    <collab-messages-input-tag-102025 
                        pattern="^[a-z]{2}$|^[a-z]{2}-[A-Z]{2}$"
                        .value=${this.languages.join(',')}
                        .onValueChanged=${(value: string) => this.languages = value.split(',')}
                        id="languageInput"
                    ></collab-messages-input-tag-102025>
                    <small> ${this.msg.languagesHint}</small>
            </div>

        
            ${this.threadType === 'channel' ? html`
                <div class="section-thread-details">
                    ${this.renderBotsConfig()}
                    ${this.renderInitialMessageConfig()}
                    ${this.renderIconConfig()}

                </div>
                <br>
                <br>
            ` : ''}

            <button
                @click=${this.addNewThread}
                ?disabled=${this.isLoading}
                >
                ${this.isLoading ? html`<span class="loader"></span>` : this.msg.btnAdd}
            </button>

            ${this.labelOk ? html`<small class="saving-ok">${this.labelOk}<small>` : ''}
            ${this.labelError ? html`<small class="saving-error">${this.labelError}<small>` : ''}   
        </div>`;
    }


    private _handleChange(e: Event) {
        const input = e.target as HTMLInputElement;
        this.threadType = input.value as ThreadType;
    }

    private renderBotsConfig() {
        return html`
            <details>
                <summary>${this.msg.detailsBot}</summary>
                <div class="form-group">
                    <label>${this.msg.selectAgent}</label>
                    <select @change=${(e: Event) => this._selectedAgent = (e.target as HTMLSelectElement).value}>
                        ${this.agentsBots.map(agent => html`
                            <option 
                                value=${agent.id} 
                                ?selected=${this._selectedAgent === agent.id}>
                                ${agent.name}${agent.description ? ` - ${agent.description}` : ''}
                            </option>
                        `)}
                    </select>
                    ${this._selectedAgent && this._selectedAgent !== 'none' ? html`
                        <label>${this.msg.agentConfig}</label>
                        <textarea 
                            rows="5" 
                            .value=${this._agentConfig}
                            placeholder=${this.msg.placeholderConfig}
                            @input=${(e: Event) => this._agentConfig = (e.target as HTMLTextAreaElement).value}
                        ></textarea>
                ` : ''}
                </div>
            </details>
        `
    }

    private renderInitialMessageConfig() {
        return html`
            <details>
                <summary>${this.msg.detailsInitialMessage}</summary>
                <div class="form-group">
                    <label>${this.msg.initialMessage}</label>
                    <textarea 
                        rows="5" 
                        .value=${this._initialMessage}
                        placeholder=${this.msg.placeholderMessage}
                        @input=${(e: Event) => this._initialMessage = (e.target as HTMLTextAreaElement).value}
                    ></textarea>
                </div>
            </details>            
        `
    }

    private renderIconConfig() {
        return html`
            <details>
                <summary>${this.msg.detailsIcon}</summary>
                <div class="form-group">
                    <label>${this.msg.avatarUrl}</label>
                    <textarea 
                        rows="5" 
                        .value=${this._promptToAvatar}
                        placeholder=${this.msg.placeholderMessageAvatar}
                        @input=${(e: Event) => this._promptToAvatar = (e.target as HTMLTextAreaElement).value}
                    ></textarea>
                </div>
            </details>            
        `
    }

    private validateForm(): boolean {
        if (this.threadType === 'dm') {
            if (!this.dmUser.trim()) return false;
            const userValid = this.users.find((user) => user.userId === this.dmUser);
            if (!userValid) {
                this.labelError = this.msg.dmValidationError;
                return false;
            }
        }

        if (this.threadType === 'channel') {
            if (!this.threadName.trim()) return false;
            if (!this.threadName.startsWith('#')) {
                this.labelError = this.msg.channelValidationError;
                return false;
            }
        }

        if (!this.group) return false;
        if (!this.visibility) return false;

        return true;
    }

    private async addNewThread() {

        if (!this.validateForm() || this.languageInput?.hasError) {
            this.labelError = this.msg.validateFormError;
            this.isLoading = false;
            return;
        }

        if (!this.userId) {
            this.labelError = this.msg.userError;
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        let avatar_url = '';
        const threadName = this.threadType === 'dm' ? `@${this.users.find((user) => user.userId === this.dmUser)?.name}` : this.threadName;

        if (this.threadType === 'dm') {

            this._topics = [];
            this._initialMessage = '';
            this._selectedAgent = '';

            const alreadyExistThread = await getDmThreadByUsers(this.userId, this.dmUser);
            if (alreadyExistThread) {
                this.labelError = this.msg.threadDmAlreadyExist;
                this.isLoading = false;
                return;
            }

            try {
                const thread = await createThreadDM(threadName, this.dmUser, this.group);
                if (this.onAddSuccess) this.onAddSuccess();
            } catch (err: any) {
                console.error(err);
                this.labelError = err.message;
            } finally {
                this.isLoading = false;
            }
        }


        if (this.threadType === 'channel') {

            if (this._selectedAgent !== 'none') {
                const botSelected = this.agentsBots.find((item) => item.id === this._selectedAgent);
                avatar_url = botSelected?.avatar_url || ''
            }

            const params: mls.msg.RequestAddThread = {
                action: 'addThread',
                name: threadName,
                group: this.group,
                languages: this.languages,
                userId: this.userId,
                visibility: this.visibility,
                status: 'active',
                avatar_url,
                welcomeMessage: this._initialMessage,
                defaultTopics: this._topics || [],
            };

            try {
                const response = await mls.api.msgAddThread(params);
                if (response.thread) {
                    const thr = await addThread(response.thread);
                    notifyThreadCreate(thr);
                    if (this._selectedAgent && this._selectedAgent !== 'none') {
                        await this.addBot(response.thread.threadId, this.userId);
                    }

                    if (this._promptToAvatar) {
                        await this.generateAvatar(response.thread.threadId, this.userId);

                    }
                    if (this.onAddSuccess) this.onAddSuccess();

                }

            } catch (err: any) {
                console.error(err);
                this.labelError = err.message;
            } finally {
                this.isLoading = false;
            }
        }


    }

    private async addBot(threadId: string, userId: string) {
        const botSelected = this.agentsBots.find((item) => item.id === this._selectedAgent);
        if (!botSelected || !botSelected.info) return;
        await addMessage(threadId, `@@BotInstall {"projectId":${botSelected.info.project}, "shortName":"${botSelected.info.shortName}", "folder":${botSelected.info.folder || '""'}}`);

        if (this._agentConfig) {

            const threadWithBot = await mls.api.msgGetThreadUpdate({
                threadId,
                userId
            });

            if (threadWithBot && threadWithBot.thread.bots) {
                const botInfo = threadWithBot.thread.bots.find((bot) => bot.botId === botSelected.id);
                if (botInfo) {
                    const res = await mls.api.msgAddOrUpdateThreadBot({
                        botId: botSelected.id,
                        config: { 'agentConfiguration': this._agentConfig },
                        llmPrompt: botInfo.llmPrompt,
                        status: 'active',
                        threadId,
                        userId
                    });
                    notifyThreadChange(res.thread);
                    if (this.onAddSuccess) this.onAddSuccess();
                }

            } else {
                notifyThreadChange(threadWithBot.thread);
                if (this.onAddSuccess) this.onAddSuccess();
            }

        }
    }

    private async generateAvatar(threadId: string, userId: string) {
        try {
        
            const agent = await loadAgent(agentName);
            if (!agent) throw new Error('Invalid agent');
            
            const context = getTemporaryContext(threadId, userId, this._promptToAvatar);
            await executeBeforePrompt(agent, context);

            if (context.task &&
                context.task.iaCompressed &&
                context.task.iaCompressed.nextSteps &&
                context.task.iaCompressed.nextSteps[0] &&
                context.task.iaCompressed.nextSteps[0].interaction &&
                context.task.iaCompressed.nextSteps[0].interaction.payload &&
                context.task.iaCompressed.nextSteps[0].interaction.payload[0]

            ) {

                const svg: string = (context.task.iaCompressed?.nextSteps[0]?.interaction?.payload[0] as mls.msg.AIFlexibleResultStep).result
                if (svg && typeof svg === 'string') {
                    const args: mls.msg.RequestUpdateThread = {
                        action: 'updateThread',
                        threadId,
                        userId,
                        avatar_url: svg
                    };
                    const response = await mls.api.msgUpdateThread(args);
                    if (response.statusCode !== 200) {
                        this.labelError = `${response.msg}`;
                    } else {
                        const threadCache = await updateThread(threadId, response.thread)
                        notifyThreadChange(threadCache);
                    }
                }
            }

        } catch (err: any) {
            console.error("Erro ao gerar avatar via IA", err);
        }
    }
}

interface IAgentsBots {
    id: string,
    name: string,
    description: string,
    avatar_url: string
    info?: mls.stor.IFileInfoBase
}

interface IAgentsList {
    agent: IAgent,
    storFile: mls.stor.IFileInfo
}

