/// <mls fileReference="_102025_/l2/collabMessagesTaskPreview.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getAllSteps } from '/_100554_/l2/aiAgentHelper.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';

import '/_102025_/l2/collabMessagesTaskPreviewAgent.js';
import '/_102025_/l2/collabMessagesTaskPreviewClarification.js';
import '/_102025_/l2/collabMessagesTaskPreviewFlexible.js';
import '/_102025_/l2/collabMessagesTaskPreviewTools.js';
import '/_102025_/l2/collabMessagesTaskPreviewResult.js';

@customElement('collab-messages-task-preview-102025')
export class CollabMessageTaskPreview extends CollabLitElement {

    @property({ type: Object }) message: mls.msg.Message | null = null;
    @property({ type: Object }) task: mls.msg.TaskData | null = null;
    @property() modeTest: boolean = false;

    @state() private stepMap = new Map<number, any>();
    @state() private navigationStack: number[] = [];
    @state() private currentStepId: number | null = null;
    @state() private allSteps: mls.msg.AIPayload[] = [];

    connectedCallback() {
        super.connectedCallback();
        if (this.modeTest) {
            setTimeout(() => {
                this.task = taskExample as unknown as mls.msg.TaskData;
                this.init();
            }, 500)
        }
    }

    disconnectedCallback() {
        window.removeEventListener('task-change', this.onTaskChange.bind(this));
    }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        if (this.modeTest) return;
        this.init();
        window.addEventListener('task-change', this.onTaskChange.bind(this));
    }

    render() {
        if (!this.task) {
            return html`<p>Task not provided.</p>`;
        }
        return html`${this.renderStep()}`;
    }

    renderStep() {
        if (!this.task) {
            return html`<p>Task not provided.</p>`;
        }
        if (!this.currentStepId) {
            return html`<p>No steps selected.</p>`;
        }
        const step = this.stepMap.get(this.currentStepId);
        if (!step) {
            return html`<p>Step not found: ${this.currentStepId}</p>`;
        }
        return html`
            ${this.renderNavigation(step.stepId)}
            <div class="container">
            ${this.renderStepDetails(step)}
            </div>
            ${this.renderBreadcrumb()}
        `;
    }

    renderNavigation(stepId: number) {
        const goToPrevious = () => {
            this.goBack()
        };
        const goToNext = () => {
            this.navigateToStep(stepId + 1)
        };
        const step = this.stepMap.get(stepId);
        const all = this.allSteps.length.toString().padStart(2, '0');
        let name = `00/${all}`;
        if (step) name = `${stepId.toString().padStart(2, '0')}/${all}`;
        return html`
            <div class="tabAction">
                <button @click=${goToPrevious} ><svg style="width:13px; fill:#fff; transform: rotateY(180deg);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg></button>
                <span>${name}</span>
                <button @click=${goToNext} ><svg style="width:13px; fill:#fff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg></button>
            </div>
        `;
    }

    renderStepDetails(step: mls.msg.AIPayload) {
        switch (step.type) {
            case 'agent': return this.renderAgent(step);
            case 'clarification': return this.renderClarification(step);
            case 'flexible': return this.renderFlexible(step);
            case 'tool': return this.renderTools(step);
            case 'result': return this.renderResult(step);
            default: return html`Not found type: renderStepDetails`;
        }
    }

    renderBreadcrumb() {
        return html`
            <nav class="breadcrumb">
                ${this.navigationStack.map(
            (stepId, idx) => {
                const step = this.stepMap.get(stepId);
                if (!step) {
                    return html`<p>Step not found: ${this.currentStepId}</p>`;
                }
                return html` <span
                            @click=${() => {
                        this.navigationStack = this.navigationStack.slice(0, idx + 1);
                        this.currentStepId = stepId;
                    }} >${step.agentName ? step.agentName : step.type}</span>
                            `
            })}
            </nav>
        `;
    }

    renderAgent(step: mls.msg.AIAgentStep) {
        return html` <collab-messages-task-preview-agent-102025 .step=${step} .message=${this.message} .task=${this.task} key="${step.stepId}"></collab-messages-task-preview-agent-102025> `;
    }

    renderClarification(step: mls.msg.AIClarificationStep) {
        return html` <collab-messages-task-preview-clarification-102025 .step=${step} .message=${this.message}  .task=${this.task} key="${step.stepId}"></collab-messages-task-preview-clarification-102025> `;
    }

    renderFlexible(step: mls.msg.AIFlexibleResultStep) {
        return html` <collab-messages-task-preview-flexible-102025 .step=${step} .message=${this.message}  .task=${this.task} key="${step.stepId}"></collab-messages-task-preview-flexible-102025> `;
    }

    renderTools(step: mls.msg.AIToolStep) {
        return html` <collab-messages-task-preview-tools-102025 .step=${step} .message=${this.message}  .task=${this.task} key="${step.stepId}"></collab-messages-task-preview-tools-102025> `;
    }

    renderResult(step: mls.msg.AIResultStep) {
        return html` <collab-messages-task-preview-result-102025 .step=${step} .message=${this.message}  .task=${this.task} key="${step.stepId}"></collab-messages-task-preview-result-102025> `;
    }

    //------IMPLEMENTATION--------

    private init() {
        if (!this.task || !this.task.iaCompressed) return;
        this.stepMap.clear();
        this.buildStepMap(this.task.iaCompressed.nextSteps);
        this.currentStepId = 1;
        this.navigationStack = [1];
        this.allSteps = getAllSteps(this.task.iaCompressed.nextSteps);
    }

    private onTaskChange(e: Event) {
        if (!this.task) return;
        const customEvent = e as CustomEvent;
        const task: mls.msg.TaskData = customEvent.detail.context.task;
        if (task.PK !== this.task.PK) return;
        this.task = task;
        if (!this.task || !this.task.iaCompressed) return;
        this.stepMap.clear();
        this.buildStepMap(this.task.iaCompressed.nextSteps);
        this.allSteps = getAllSteps(this.task.iaCompressed.nextSteps);
    }

    private buildStepMap(steps: mls.msg.AIPayload[]) {
        for (const step of steps) {
            this.stepMap.set(step.stepId, step);
            if (step.interaction?.payload) {
                this.buildStepMap(step.interaction.payload);
            }
            if (step.nextSteps) {
                this.buildStepMap(step.nextSteps);
            }
        }
    }

    private navigateToStep(stepId: number) {
        if (!this.stepMap.has(stepId)) {
            return;
        }
        this.currentStepId = stepId;
        this.navigationStack = [...this.navigationStack, stepId];
    }

    private goBack() {
        if (this.navigationStack.length > 1) {
            this.navigationStack.pop();
            this.currentStepId = this.navigationStack[this.navigationStack.length - 1];
        }
    }

}

const taskExample = {
    "last_update_log": "Task started by Santiago at 2025-05-29T13:25:49.461Z",
    "last_updated": 1748525283418,
    "status": "done",
    "SK": "metadata",
    "owner": "20250417120844.1000",
    "source": "",
    "team": "unassigned",
    "PK": "task#1748525148375",
    "messageid_created": "20250423205309.1000/20250529132548.1000",
    "iaCompressed": {
        "longMemory": {
            "dataAtual": "2025-05-29",
            "userName": "Santiago"
        },
        "nextSteps": [
            {
                "stepId": 1,
                "type": "agent",
                "agentName": "agentPlanner1",
                "nextSteps": [],
                "status": "completed",
                "rags": [],
                "interaction": {
                    "input": [
                        {
                            "type": "system",
                            "content": "Você é um coordenador de agentes e ferramentas para executar tarefas com base no prompt do usuário.\nSeu único objetivo neste momento é classificar o tipo de ação necessária a partir do prompt.\nREGRAS:\n1. Retorne **exatamente uma subtarefa** de um dos seguintes tipos: 'agent' ou 'result'.\n2. Se o prompt for vago ou ambíguo ou não contiver informação suficiente para decidir entre 'agent' ou 'result', retorne um result com mensagem de prompt inválido.\n4. Use 'result' quando o sistema puder **responder diretamente ao usuário** sem envolver agentes.\n5. Use 'agent' quando a tarefa requerer **ação ativa ou execução por parte de um agente ou ferramenta externa**.\n- Neste caso, inclua o prompt original do usuário no campo 'prompt'.\n6. Não modifique o conteúdo do prompt original.\n7. Não elabore respostas nem explique suas escolhas – apenas classifique.\nEXEMPLOS:\nUsuário: \"Criar uma landing page para um produto fitness\"\nResposta: Agente\nUsuário: \"Qual é a capital da Alemanha?\"\nResposta: Result\nUsuário: \"Me ajude\"\nResposta: Result\n"
                        },
                        {
                            "type": "system",
                            "content": "## Content Memory\ndataAtual: 2025-05-29\nuserName: Santiago\n"
                        },
                        {
                            "type": "system",
                            "content": "## Agentes disponíveis:\nAgentes disponíveis:\n• agentAnalyzeNewModule1:planejamento para a criação de novos projetos, sites ou criação de uma nova página\n• agentPlannerNewWidget:criação de novos componentes UI, web components, widgets, estes widgets podem futuramente serem incluidos em uma página html.\n• agentPlannerNewAPI:criação de endpoints ou APIs, será pedido mais informações ao usuário se necessário.\n• agentSupportExternal:suporte para usuários externos. Executar rag1 antes de enviar o prompt.\n• agentSupportInternal:suporte para usuários internos. Executar os RAGs rag1 e rag2 antes de enviar o prompt."
                        }
                    ],
                    "cost": 0.0001,
                    "trace": [
                        "provider: openai user:'Santiago' model:gpt-4.1-nano inputTokens:703 outputTokens:92 inputCost:0.10/1M outputCost:0.40/1M total:$0.0001 llmTime: 1741ms"
                    ],
                    "payload": [
                        {
                            "type": "agent",
                            "agentName": "agentNewWidget",
                            "title": "Criar widget de hora mundial com saudações",
                            "rags": null,
                            "status": "completed",
                            "stepId": 2,
                            "interaction": {
                                "input": [
                                    {
                                        "type": "system",
                                        "content": "Você é um planejador responsável por definir os detalhes de criação de um novo web-componente (widget) que será incluído em uma página HTML.\nTarefas\n1. Entenda o propósito do widget passando pelo prompt original do usuário.\n2. Escolha o widgetName, evitando colisões com a lista “Widgets existentes”, o widgetName deve iniciar com o prefixo \"widget\".\n3. Escolha o parentClass base mais adequado na lista “Categorias de widgets”.\n4. Cruze os atributos do grupo escolhido com as necessidades do widget:\n• Liste apenas os atributos relevantes que já existirem no grupo.\n• Para cada necessidade sem atributo correspondente, gere um novo atributo\ne adicione “(essencial)” na descrição.\n5. Defina restrições e requisitos técnicos/funcionais.\n6. Se o prompt original não tratar da criação de web-componente, retorne um erro pedindo ao usuário refazer o pedido.\n7. Caso contrário, devolva um bloco **clarification** com o json base abaixo, usando textos na linguagem do usuário.\n## Formato de saida\nVocê deve retornar um array de objetos no formato JSON. Cada objeto representa uma subtarefa, com **apenas um dos seguintes formatos**:\n``` json\n[\n{\n\"type\": \"clarification\",\n\"clarificationMessage\": string,\n\"json\": TClarification\n},\n{\n\"type\": \"result\",\n\"result\": string\n}\n]\n```\ndefinição de TClarification\n```json\n[\n{\n\"sectionName\": \"resume\",\n\"description\": \"[Breve descrição do widget]\"\n},\n{\n\"sectionName\": \"parentClass\",\n\"description\": \"Component for selecting date ranges, useful for period filters.\"\n\"widgetName\": \"IcaFormsInputDateRangeBase\"\n},\n{\n\"sectionName\": \"widgetName\",\n\"description\": \"Nome do Widget\",\n\"widgetName\": \"[WidgetName ex: wcDatePickerRangeCustom]\"\n\"tagName\": \"[WidgetTagName ex: wc-date-picker-range-custom]\"\n},\n{\n\"sectionName\": \"properties\",\n\"description\": \"Propriedades do widget\",\n\"properties\": [\n{ \"propertyName\": \"[propertyName]\", \"description\": \"[description]\", \"isEssencial\": \"true|false\" }\n]\n},\n{\n\"sectionName\": \"requirements\",\n\"description\": \"requisitos para este widget, altere se necessário\",\n\"functionalRequirements\": [\n\"[example 1 - Must support keyboard navigation]\",\n\"[example 2 - Return ISO-8601 date strings]\"\n],\n\"visualRequirements\": [\n\"[example 1 - Must render two consecutive months side by side]\",\n\"[example 2 - Must clearly differentiate between selected, hovered, and disabled dates]\"\n],\n}\n]\n```"
                                    },
                                    {
                                        "type": "system",
                                        "content": "## Content Memory\ndataAtual: 2025-05-29\nuserName: Santiago\n"
                                    },
                                ],
                                "cost": 0.0032,
                                "trace": [
                                    "provider: openai user:'Santiago' model:gpt-4.1-mini inputTokens:5481 outputTokens:612 inputCost:0.40/1M outputCost:1.60/1M total:$0.0032 llmTime: 13387ms",
                                    "adding new step"
                                ],
                                "payload": [
                                    {
                                        "type": "clarification",
                                        "templateWidget": "_100554_wcClarificationPlannerNewWidget",
                                        "clarificationMessage": "Criando um widget que ao clicar em um botão exibe as horas atuais em diferentes países (EUA, Portugal, China, Japão e Rússia) com base na hora local do usuário, além de mostrar uma breve saudação em cada idioma local.",
                                        "json": [
                                            {
                                                "sectionName": "resume",
                                                "description": "Widget que exibe a hora atual em múltiplos fusos horários e uma saudação local ao clicar em um botão."
                                            },
                                            {
                                                "sectionName": "parentClass",
                                                "description": "Component for interactive actions and displaying dynamic text content.",
                                                "widgetName": "ica-forms-input-string"
                                            },
                                            {
                                                "sectionName": "widgetName",
                                                "description": "Nome do Widget",
                                                "widgetName": "widgetTimeZoneGreeting",
                                                "tagName": "widget-time-zone-greeting"
                                            },
                                            {
                                                "sectionName": "properties",
                                                "description": "Propriedades do widget",
                                                "properties": [
                                                    {
                                                        "propertyName": "buttonLabel",
                                                        "description": "Texto exibido no botão para ativar a exibição das horas e saudações.",
                                                        "isEssencial": true
                                                    },
                                                    {
                                                        "propertyName": "timeZones",
                                                        "description": "Lista dos fusos horários a serem exibidos (ex: 'America/New_York', 'Europe/Lisbon', etc.). (essencial)",
                                                        "isEssencial": true
                                                    },
                                                    {
                                                        "propertyName": "greetings",
                                                        "description": "Saudações correspondentes a cada país/fuso horário, no idioma local. (essencial)",
                                                        "isEssencial": true
                                                    },
                                                    {
                                                        "propertyName": "showTimes",
                                                        "description": "Flag para controlar a exibição das horas e saudações após o clique no botão.",
                                                        "isEssencial": true
                                                    },
                                                    {
                                                        "propertyName": "userLocalTime",
                                                        "description": "Hora local do usuário para cálculo dos horários nos fusos selecionados.",
                                                        "isEssencial": true
                                                    }
                                                ]
                                            },
                                            {
                                                "sectionName": "requirements",
                                                "description": "Requisitos para este widget",
                                                "functionalRequirements": [
                                                    "Deve calcular corretamente a hora atual em cada fuso horário baseado na hora local do usuário.",
                                                    "Deve exibir uma saudação breve no idioma local de cada país listado.",
                                                    "Deve atualizar a exibição ao clicar no botão.",
                                                    "Suporte a acessibilidade para o botão e textos exibidos."
                                                ],
                                                "visualRequirements": [
                                                    "Botão claramente visível e acessível.",
                                                    "Exibição clara e organizada das horas e saudações para cada país.",
                                                    "Diferenciação visual entre o botão e as informações exibidas."
                                                ]
                                            }
                                        ],
                                        "status": "completed",
                                        "stepId": 3,
                                        "interaction": null,
                                        "nextSteps": [
                                            {
                                                "type": "agent",
                                                "stepId": 4,
                                                "status": "completed",
                                                "agentName": "agentNewWidget2",
                                                "rags": null,
                                                "interaction": {
                                                    "input": [
                                                        {
                                                            "type": "system",
                                                            "content": "Você é um programador responsável pela criação de um novo web componente (widget) para o sistema Collab Codes.\nSe não for possível cumprir esta tarefa (por falta de dados ou conflito de requisitos), **retorne um objeto JSON** do tipo \"result\", com uma descrição do problema.\nSe for possível cumprir esta tarefa, **retorne um objeto JSON** do tipo \"flexible\", contendo o typescript gerado, o html gerado e o less gerado.\n"
                                                        },
                                                        {
                                                            "type": "system",
                                                            "content": "## Content Memory\ndataAtual: 2025-05-29\nuserName: Santiago\n"
                                                        },
                                                    ],
                                                    "cost": 0.0288,
                                                    "trace": [
                                                        "provider: openai user:'Santiago' model:gpt-4.1 inputTokens:4494 outputTokens:2480 inputCost:2.00/1M outputCost:8.00/1M total:$0.0288 llmTime: 42474ms",
                                                        "adding new step"
                                                    ],
                                                    "payload": [
                                                        {
                                                            "type": "flexible",
                                                            "result": {
                                                                "shortName": "widgetTimeZoneGreeting",
                                                                "ts": "/// <mls shortName=\"widgetTimeZoneGreeting\" project=\"100554\" enhancement=\"_100554_enhancementLit\" groupName=\"other\" />\n\nimport { html, ifDefined } from 'lit';\nimport { customElement } from 'lit/decorators.js';\nimport { IcaFormsInputStringBase } from './_100554_icaFormsInputStringBase';\nimport { propertyCompositeDataSource, propertyDataSource } from './_100554_collabDecorators';\n/**\n * Widget que exibe a hora atual em múltiplos fusos horários e uma saudação local ao clicar em um botão.\n * Exibe EUA, Portugal, China, Japão e Rússia.\n */\n@customElement('widget-time-zone-greeting-100554')\nexport class WidgetTimeZoneGreeting extends IcaFormsInputStringBase {\n /**\n * Nome do campo para binding.\n * @example name=\"greetingTime\"\n */\n @propertyCompositeDataSource({ type: String }) name: string | undefined;\n /**\n * Dica de campo.\n * @example hint=\"Veja as horas pelo mundo\"\n */\n @propertyCompositeDataSource({ type: String }) hint: string | undefined;\n /**\n * Valor do campo (não utilizado neste widget).\n */\n @propertyDataSource({ type: String }) value: string | undefined;\n /**\n * Rótulo do campo.\n * @example label=\"Horas pelo mundo\"\n */\n @propertyCompositeDataSource({ type: String }) label: string | undefined;\n /**\n * Campo obrigatório?\n */\n @propertyDataSource({ type: Boolean }) required: boolean = false;\n /**\n * Campo desabilitado?\n */\n @propertyDataSource({ type: Boolean }) disabled: boolean = false;\n /**\n * Tamanho máximo do texto.\n */\n @propertyDataSource({ type: Number }) maxlength: number | undefined;\n /**\n * Tamanho mínimo do texto.\n */\n @propertyDataSource({ type: Number }) minlength: number | undefined;\n /**\n * Placeholder do campo.\n */\n @propertyCompositeDataSource({ type: String }) placeholder: string | undefined;\n /**\n * Regex de validação.\n */\n @propertyCompositeDataSource({ type: String }) pattern: string | undefined;\n /**\n * Mensagem de erro customizada.\n */\n @propertyCompositeDataSource({ type: String }) errormessage: string | undefined;\n /**\n * Autofoco?\n */\n @propertyDataSource({ type: Boolean }) autofocus: boolean = false;\n /**\n * Autocapitalize.\n */\n @propertyDataSource({ type: String }) autocapitalize: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters' = 'off';\n /**\n * Autocorrect.\n */\n @propertyDataSource({ type: String }) autocorrect: 'off' | 'on' | undefined = 'off';\n /**\n * Autocomplete.\n */\n @propertyDataSource({ type: String }) autocomplete: string | undefined;\n /**\n * Mensagem de validação customizada.\n */\n @propertyDataSource({ type: String }) validationmessage: string | undefined;\n /**\n * Debounce.\n */\n @propertyDataSource({ type: String }) debounce: string | undefined;\n /**\n * Somente leitura?\n */\n @propertyDataSource({ type: Boolean }) readonly: boolean = false;\n /**\n * Texto exibido no botão para ativar a exibição das horas e saudações.\n * @example buttonLabel=\"Ver horários pelo mundo\"\n */\n @propertyCompositeDataSource({ type: String }) buttonLabel: string = 'Ver horários pelo mundo';\n /**\n * Lista dos fusos horários a serem exibidos.\n * @example timeZones=\"America/New_York,Europe/Lisbon,Asia/Shanghai,Asia/Tokyo,Europe/Moscow\"\n */\n @propertyCompositeDataSource({ type: String }) timeZones: string = 'America/New_York,Europe/Lisbon,Asia/Shanghai,Asia/Tokyo,Europe/Moscow';\n /**\n * Saudações correspondentes a cada país/fuso horário, no idioma local.\n * @example greetings=\"Hello,Olá,你好,こんにちは,Здравствуйте\"\n */\n @propertyCompositeDataSource({ type: String }) greetings: string = 'Hello,Olá,你好,こんにちは,Здравствуйте';\n /**\n * Flag para controlar a exibição das horas e saudações após o clique no botão.\n * @example showTimes=\"false\"\n */\n @propertyDataSource({ type: Boolean }) showTimes: boolean = false;\n /**\n * Hora local do usuário para cálculo dos horários nos fusos selecionados.\n * @example userLocalTime=\"2025-05-29T12:00:00\"\n */\n @propertyCompositeDataSource({ type: String }) userLocalTime: string | undefined;\n private handleShowTimes = () => {\n this.showTimes = true;\n this.requestUpdate();\n };\n private getTimeZoneData() {\n const zones = (this.timeZones || '').split(',').map(z => z.trim());\n const greets = (this.greetings || '').split(',');\n const now = this.userLocalTime ? new Date(this.userLocalTime) : new Date();\n return zones.map((zone, idx) => {\n let timeString = '';\n try {\n timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: zone });\n } catch {\n timeString = '--:--';\n }\n return {\n zone,\n greeting: greets[idx] || '',\n time: timeString\n };\n });\n }\n render() {\n return html`\n <div class=\"cc-tzg-container\">\n <label class=\"cc-tzg-label\">${this.label || 'Horas pelo mundo'}</label>\n <button\n class=\"cc-tzg-btn\"\n @click=${this.handleShowTimes}\n ?disabled=${this.disabled}\n aria-label=${this.buttonLabel}\n >${this.buttonLabel}</button>\n ${this.showTimes ? html`\n <ul class=\"cc-tzg-list\">\n ${this.getTimeZoneData().map(item => html`\n <li class=\"cc-tzg-item\">\n <span class=\"cc-tzg-country\">${item.zone}</span>\n <span class=\"cc-tzg-time\">${item.time}</span>\n <span class=\"cc-tzg-greet\">${item.greeting}</span>\n </li>\n `)}\n </ul>\n ` : ''}\n ${this.hint ? html`<div class=\"cc-tzg-hint\">${this.hint}</div>` : ''}\n ${this.errormessage ? html`<div class=\"cc-tzg-error\">${this.errormessage}</div>` : ''}\n </div>\n `;\n }\n}\n",
                                                                "less": "widget-time-zone-greeting-100554 {\n.cc-tzg-container {\nbackground: @bg-primary-color;\npadding: @space-24;\nborder-radius: @space-8;\nbox-shadow: 0 2px 8px @grey-color-light;\n}\n.cc-tzg-label {\ndisplay: block;\nfont-family: @font-family-primary;\nfont-size: @font-size-20;\nfont-weight: @font-weight-bold;\ncolor: @text-primary-color;\nmargin-bottom: @space-16;\n}\n.cc-tzg-btn {\nbackground: @text-secondary-color;\ncolor: @bg-primary-color;\nborder: none;\nborder-radius: @space-8;\npadding: @space-8 @space-24;\nfont-size: @font-size-16;\ncursor: pointer;\ntransition: background @transition-normal;\nfont-family: @font-family-primary;\nfont-weight: @font-weight-bold;\nmargin-bottom: @space-24;\n&:hover {\nbackground: @text-secondary-color-hover;\n}\n&:focus {\nbackground: @text-secondary-color-focus;\noutline: 2px solid @text-secondary-color-darker;\n}\n&:disabled {\nbackground: @text-secondary-color-disabled;\ncursor: not-allowed;\n}\n}\n.cc-tzg-list {\nlist-style: none;\npadding: 0;\nmargin: 0;\n}\n.cc-tzg-item {\ndisplay: flex;\nalign-items: center;\nmargin-bottom: @space-16;\nfont-size: @font-size-16;\nfont-family: @font-family-primary;\ncolor: @text-primary-color-lighter;\n}\n.cc-tzg-country {\nmin-width: 140px;\nfont-weight: @font-weight-bold;\ncolor: @text-primary-color-darker;\n}\n.cc-tzg-time {\nmin-width: 70px;\nmargin-left: @space-16;\ncolor: @text-primary-color;\n}\n.cc-tzg-greet {\nmargin-left: @space-16;\ncolor: @text-secondary-color-darker;\nfont-weight: @font-weight-bold;\n}\n.cc-tzg-hint {\nmargin-top: @space-16;\ncolor: @text-primary-color-lighter;\nfont-size: @font-size-12;\n}\n.cc-tzg-error {\nmargin-top: @space-16;\ncolor: @error-color;\nfont-size: @font-size-12;\n}\n}\n",
                                                                "html": "<div style=\"max-width:420px;margin:40px auto;background:#fff;padding:32px;border-radius:8px;box-shadow:0 2px 8px #F2F2F2;\">\n <widget-time-zone-greeting-100554\n label=\"Horas pelo mundo\"\n buttonLabel=\"Ver horários pelo mundo\"\n timeZones=\"America/New_York,Europe/Lisbon,Asia/Shanghai,Asia/Tokyo,Europe/Moscow\"\n greetings=\"Hello,Olá,你好,こんにちは,Здравствуйте\"\n hint=\"Clique para ver as horas e saudações nos principais países.\"\n userLocalTime=\"2025-05-29T12:00:00\"\n style=\"width:100%;\"\n ></widget-time-zone-greeting-100554>\n</div>\n"
                                                            },
                                                            "status": "completed",
                                                            "stepId": 5,
                                                            "interaction": null,
                                                            "nextSteps": [
                                                                {
                                                                    "type": "agent",
                                                                    "stepId": 6,
                                                                    "status": "failed",
                                                                    "agentName": "agentNewWidget3",
                                                                    "prompt": "{\"prompt\":\"Criar site para petshop\n\"}",
                                                                    "rags": null,
                                                                    "interaction": null,
                                                                    "nextSteps": null
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                "nextSteps": null
                                            }
                                        ]
                                    }
                                ]
                            },
                            "nextSteps": null
                        }
                    ]
                }
            }
        ],
        "title": "Widget created"
    }
};