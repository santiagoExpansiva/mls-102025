/// <mls fileReference="_102025_/l2/serviceCollabMessages.ts" enhancement="_102027_/l2/enhancementLit" /> 

import { html, ifDefined } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { addCoachMark, ICoachMarks } from '/_100554_/l2/coachMarks';
import {
    listThreads,
    addThread,
    listUsers,
    updateUsers,
    getThread,
    cleanupThreads,
    listPoolings,
    getTask,
    getMessage,
    deletePooling,
    getAllThreads
} from '/_102025_/l2/collabMessagesIndexedDB.js';
import {
    saveLastTab,
    loadLastTab,
    saveUserId,
    saveLastAlertTime,
    loadLastAlertTime
} from "/_102025_/l2/collabMessagesHelper.js";

import { openService, changeFavIcon } from "/_100554_/l2/libCommom.js";
import { continuePoolingTask } from "/_100554_/l2/aiAgentOrchestration.js";
import { checkIfNotificationUnread } from '/_102025_/l2/collabMessagesSyncNotifications.js';

import { ServiceBase, IService, IToolbarContent, IServiceMenu } from '/_100554_/l2/serviceBase.js';
import { ICollabMessageEvent } from '/_102025_/l2/collabMessagesHelper.js';

import { collab_bell_slash, collab_xmark } from '/_102025_/l2/collabMessagesIcons.js';

import '/_102025_/l2/collabMessagesAdd.js';
import '/_102025_/l2/collabMessagesChat.js';
import '/_102025_/l2/collabMessagesTasks.js';
import '/_102025_/l2/collabMessagesApps.js';
import '/_102025_/l2/collabMessagesMoments.js';
import '/_102025_/l2/collabMessagesSettings.js';
import '/_102025_/l2/collabMessagesFindtask.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    crm: 'CRM',
    tasks: 'Tasks',
    docs: 'Docs',
    connect: 'Conectar',
    alertMsgTitle: 'Ative as notificações',
    alertMsgBody: 'Para não perder mensagens importantes, permita notificações no navegador.',
    moments: 'Moments',
    apps: 'Apps'

}

const message_en = {
    loading: 'Loading...',
    crm: 'CRM',
    tasks: 'Tasks',
    docs: 'Docs',
    connect: 'Connect',
    alertMsgTitle: 'Enable notifications',
    alertMsgBody: 'To avoid missing important messages, allow notifications in your browser.',
    moments: 'Moments',
    apps: 'Apps'
}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('service-collab-messages-102025')
export class ServiceCollabMessages extends ServiceBase {

    private msg: MessageType = messages['en'];

    @property() dataLocal: IDataLocal = { lastTab: 'CRM' };
    @property() activeTab: ITabType = 'CRM';
    @property() activeScenerie: IScenery = 'tabs';
    @state() isLoadingThread: boolean = false;
    @state() userPerfil: mls.msg.User | undefined;
    @state() userThreads: IThreadData = {}
    @state() showNotificationAlert: boolean = false;

    @state() threadToOpen: string = '';
    @state() taskToOpen: string = '';
    @state() lastLevel: number = -1;

    groupSelected: ITabType = 'CRM';

    public details: IService = {
        icon: '&#xf086',
        state: 'background',
        position: 'right',
        tooltip: 'Messages',
        visible: true,
        widget: '_102025_serviceCollabMessages',
        level: [0, 2, 3, 5]
    }

    public onClickTabs(index: number) {
        this.threadToOpen = '';
        this.taskToOpen = '';

        if (this.activeTab === ETabs[index]) {
            this.activeTab = 'Loading';
            setTimeout(() => {
                this.activeTab = ETabs[index] as ITabType;
            }, 0)
            return;
        };
        this.activeTab = ETabs[index] as ITabType;
        saveLastTab(this.activeTab);

    }

    public onClickMain(op: string) {
        if (op === 'opAboutThis') this.showAboutThis();
        if (op === 'opReset') this.resetOnBoarding();
        if (op === 'opSettings') this.openSettings();
        if (op === 'opFindTask') this.openFindTask();
    }

    public menu: IServiceMenu = {
        title: '',
        main: {
            opReset: { text: 'Reset onboarding', icon: 'f2ea' },
            opSettings: { text: 'Settings', icon: 'f085' },
            opFindTask: { text: 'Find Task', icon: 'f002' },
            opAboutThis: 'About this content',
        },
        tools: {
        },
        tabs: {
            group: 'Mode',
            type: 'onlyicon',
            selected: ETabs.Loading,
            options: [
                { text: this.msg.crm, icon: 'f095' },
                { text: this.msg.tasks, icon: 'f0ae' },
                { text: this.msg.connect, icon: 'f0c1' },
                { text: this.msg.moments, icon: 'f1ea' },
                { text: this.msg.apps, icon: 'f58d' },
            ]
        },
        onClickMain: this.onClickMain.bind(this),
        onClickTabs: this.onClickTabs.bind(this),

    }

    onServiceClick(visible: boolean, reinit: boolean, el: IToolbarContent | null) {
        if (visible) {
            this.checkNotificationPermission();
            this.configureByLevel();
        }
    }

    async connectedCallback() {
        super.connectedCallback();
        this.dataLocal.lastTab = loadLastTab() as ITabType;
        this.setEvents();
    }

    disconnectedCallback() {
        this.removeEvents();
    }

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        window.addEventListener('thread-change', this.onThreadChange.bind(this));
        this.startPendentsPoolingsIfNeeded();
        this.checkNotificationPending();
    }

    async updated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);
        if (changedProperties.has('activeTab') && ['CRM', 'TASK', 'DOCS', 'CONNECT', 'APPS'].includes(this.activeTab)) {

            if (!this.userPerfil) {
                this.userPerfil = await this.getUser();
                saveUserId(this.userPerfil.userId);
                await cleanupThreads(this.userPerfil.threads);
            }

            await this.getThreadFromLocalDB();
            this.updateThreads();
        }

        if (changedProperties.has('dataLocal')) {
            if (this.menu.setTabActive && this.activeTab !== 'Loading') this.menu.setTabActive(ETabs[this.dataLocal.lastTab])
        }
    }

    render() {
        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        return this.renderTabs();
    }

    private changeDisplayMenu(show: boolean) {
        if (!this.nav3Menu) return;
        const item = this.nav3Menu?.querySelector('li[data-key="4"]') as HTMLElement;
        if (!item) return;
        if (show) item.style.display = 'inline-flex';
        else item.style.display = 'none';
    }

    private isFirstEnter: boolean = true;
    private configureByLevel() {
        if (!this.menu || !this.menu.tabs || !this.menu.setTabActive) return;
        this.changeDisplayMenu(this.level === 7);
        if (this.isFirstEnter) {
            this.isFirstEnter = false;
            let lastActive = ETabs[loadLastTab() as ITabType];
            lastActive = lastActive === ETabs.APPS && this.level !== 7 ? ETabs.CONNECT : lastActive;
            this.menu.setTabActive(lastActive);
        }

        if (this.level !== 7 && this.activeTab === 'APPS') {
            this.menu.setTabActive(ETabs.CONNECT)
        }

        this.lastLevel = this.level;
    }

    private checkNotificationPermission() {

        if (typeof Notification === "undefined" || Notification.permission !== "denied") {
            return;
        }
        const lastShown = Number(loadLastAlertTime() || 0);
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (!lastShown || (now - lastShown) > oneWeek) {
            this.showNotificationAlert = true;
            saveLastAlertTime(now);
        }
    }

    private async startPendentsPoolingsIfNeeded() {
        const pendingsTasks = await listPoolings();
        if (!pendingsTasks || pendingsTasks.length === 0) return;

        for (let taskPending of pendingsTasks) {
            const task = await getTask(taskPending.taskId);
            if (!task || !task.messageid_created) continue;
            const message = await getMessage(task.messageid_created);
            if (!message) continue;
            try {
                const context: mls.msg.ExecutionContext = { message, task, isTest: false };
                // await continuePoolingTask(context);
            } catch (err) {
                deletePooling(task.PK);
            }

        }

    }

    private showAboutThis(): boolean {

        const div = document.createElement('div');
        div.style.padding = '1rem';

        let name = 'nothing selected';

        switch (this.activeTab) {
            case 'CRM':
                name = 'collab-messages-chat-102025';
                break;
            case 'TASK':
                name = 'collab-messages-tasks-102025';
                break;
            case 'APPS':
                name = 'collab-messages-apps-102025';
                break;
            case 'MOMENTS':
                name = 'collab-messages-moments-102025';
                break;
            case 'CONNECT':
                name = 'collab-messages-chat-102025';
                break;
            default:
                name = 'nothing selected';
        }

        div.innerHTML = `
        
            <h3>About this content</h3>
            <ul>
                <li>Reference: ${name}</li>
                <li>Level: ${this.level}</li>
                <li>Position: ${this.position}</li>
            </ul>
        `;

        if (this.menu.setMode) this.menu.setMode('page', div);
        return true;

    }

    private onThreadChange = async (e: Event) => {
        const customEvent = e as CustomEvent;
        const thread = customEvent.detail as mls.msg.Thread;
        if (this.userThreads[thread.threadId]) {
            this.userThreads[thread.threadId].thread = thread;
        } else {
            await this.updateUsersThread(thread);
        }

        if (this.groupSelected !== 'CONNECT') {
            this.checkNotificationPending();
        }
    }

    private setEvents() {
        mls.events.addEventListener([0, 1, 2, 3, 4, 5, 6, 7], ['collabMessages'] as any, this.onCollabEventsCollabMessages.bind(this));
        window.addEventListener('thread-create', this.onThreadCreate);
    }

    private removeEvents() {
        window.removeEventListener('thread-create', this.onThreadCreate);
        window.removeEventListener('thread-change', this.onThreadChange.bind(this));
        mls.events.removeEventListener([0, 1, 2, 3, 4, 5, 6, 7], ['collabMessages'] as any, this.onCollabEventsCollabMessages.bind(this));
    }


    renderTabs() {
        switch (this.activeTab) {
            case 'CRM':
                return this.renderCRM();
            case 'TASK':
                return this.renderTasks()
            case 'MOMENTS':
                return this.renderMoments();
            case 'APPS':
                return this.renderApps();
            case 'CONNECT':
                return this.renderConnect();
            case 'Loading':
                return html`${this.msg.loading}`
            default:
                return html``;
        }
    }

    renderAlert() {
        if (!this.showNotificationAlert) return html``
        return html`  
            <div class="alert-notification">
                ${collab_bell_slash}
                <div>
                    <strong>${this.msg.alertMsgTitle}</strong><br>
                    ${this.msg.alertMsgBody}
                <div>
                
                <button @click=${this.onAlertClose}>${collab_xmark}</button>
            </div>
        `
    }

    private onAlertClose() {
        this.showNotificationAlert = false;
    }

    renderCRM() {
        this.groupSelected = 'CRM';
        // this.execCoachMarks('CRM');
        return html`
        ${this.renderAlert()}
        <collab-messages-chat-102025 
            .isLoadingThread= ${this.isLoadingThread}
            group="CRM"
            .userThreads=${{
                CRM: Object.keys(this.userThreads)
                    .filter((key) => this.userThreads[key].thread.group === 'CRM')
                    .map((key) => this.userThreads[key])
            }} 
            .allThreads=${Object.keys(this.userThreads).map((key) => this.userThreads[key].thread)}
            
            userId=${this.userPerfil?.userId} 
        ></collab-messages-chat-102025>`
    }

    renderTasks() {
        this.groupSelected = 'TASK';
        // this.execCoachMarks('Tasks');
        return html`<collab-messages-tasks-102025></collab-messages-tasks-102025>`
    }

    renderMoments() {
        this.groupSelected = 'MOMENTS';
        // this.execCoachMarks('Moments');
        return html`<collab-messages-moments-102025 ></collab-messages-moments-102025>`
    }

    renderApps() {
        this.groupSelected = 'APPS';
        // this.execCoachMarks('Apps');
        return html`<collab-messages-apps-102025 ></collab-messages-apps-102025>`
    }

    renderConnect() {

        this.groupSelected = 'CONNECT';
        // this.execCoachMarks('Connect');
        return html`
        ${this.renderAlert()}
        <collab-messages-chat-102025 
            
            .isLoadingThread= ${this.isLoadingThread}
            group="CONNECT"
            .userThreads=${{
                CONNECT: Object.keys(this.userThreads)
                    .filter((key) => this.userThreads[key].thread.group === 'CONNECT')
                    .map((key) => this.userThreads[key])
            }}
            .allThreads=${Object.keys(this.userThreads).map((key) => this.userThreads[key].thread)}
            threadToOpen=${ifDefined(this.threadToOpen || undefined)}
            taskToOpen=${ifDefined(this.taskToOpen || undefined)}

            userId=${this.userPerfil?.userId} 
        ></collab-messages-chat-102025>`
    }


    private async getUser(): Promise<mls.msg.User> {
        try {
            const response = await mls.api.msgGetUserUpdate({ userId: "" });
            return response.user;
        } catch (err: any) {
            this.setError(err.message);
            throw new Error(err.message);
        }
    }

    private async updateThreads() {

        if (!this.userPerfil?.userId) {
            this.setError('Invalid userId');
            return;
        }

        this.isLoadingThread = true;
        const userId = this.userPerfil.userId;
        const userThreads: string[] = this.userPerfil.threads;

        for await (let threadId of userThreads) {
            if (this.userThreads[threadId]) {
                continue;
            }
            const threadInfo = await this.getThreadInfo(threadId, userId);
            this.userThreads[threadId] = threadInfo;
            addThread(threadInfo.thread);
            updateUsers(threadInfo.users);
        }

        await this.searchForDeletedThreadsPending();

        this.isLoadingThread = false;
        this.requestUpdate();

    }

    private async searchForDeletedThreadsPending() {
        const allLocalThreads = await getAllThreads();
        const deletedThreadsPending = allLocalThreads.filter((thread) => thread.status === 'deleted' && thread.unreadCount && thread.unreadCount !== 0);
        for await (let thread of deletedThreadsPending) {
            this.userThreads[thread.threadId] = {
                thread,
                users: []
            };
        }
    }

    private async updateUsersThread(thread: mls.msg.Thread) {

        if (!this.userPerfil?.userId) {
            this.setError('Invalid userId');
            return;
        }

        const userId = this.userPerfil.userId;
        const threadInfo = await this.getThreadInfo(thread.threadId, userId);
        this.userThreads[thread.threadId] = {
            thread,
            users: threadInfo.users
        }
        addThread(thread);
        updateUsers(threadInfo.users);
        this.isLoadingThread = false;
        this.requestUpdate();

    }

    private async getThreadFromLocalDB() {

        const threads = await listThreads();
        const users = await listUsers();

        for (let thread of threads) {
            if (this.userThreads[thread.threadId]) {
                return;
            }
            const threadUsers: mls.msg.User[] = [];
            thread.users.forEach((user) => {
                const userDB = users.find((us) => us.userId === user.userId);
                if (userDB) threadUsers.push(userDB);
            })
            this.userThreads[thread.threadId] = {
                thread: thread,
                users: threadUsers
            }
        }

    }

    private async getThreadInfo(threadId: string, userId: string): Promise<IThreadInfo> {
        try {
            const response = await mls.api.msgGetThreadUpdate({
                threadId,
                userId
            });
            return response;

        } catch (err: any) {
            this.setError('Erro ao buscar threads: ' + err);
            throw new Error(err.message)
        }
    }


    private execCoachMarks(name: string) {
        if (this.visible === 'false') return;

        const infoMark: ICoachMarks = {
            key: `serviceCollabMessage${name}`,
            transparency: "normal",
            fontSize: "1.1em",
            timeClose: 15,
            steps: [
                {
                    elementRef: `collab-nav-3-menu li[data-tooltip="${name}"]`,
                    text: `<div style="padding:1rem;"><img src="/100554/l3/assets/coachMarkCollabMessages${name}.png"  style="display: block; max-width: 100%; height: auto;"></img></div>`,
                    position: "bottom",
                    marginV: 25,
                    marginH: 25,
                    arrow: "up",
                    duration: 15,
                    autoClose: true,

                },
            ]
        }
        addCoachMark(infoMark);
    }

    private resetOnBoarding() {
        const ls = localStorage.getItem('coach-marks-100554');
        if (!ls) return;
        const data: string[] = JSON.parse(ls);

        ['CRM', 'Tasks', 'Docs', 'Connect', 'Apps'].forEach((tab) => {
            const indexToRemove = data.findIndex((item) => item === `serviceCollabMessage${tab}`);
            if (indexToRemove !== -1) {
                data.splice(indexToRemove, 1);
            }
        });

        localStorage.setItem('coach-marks-100554', JSON.stringify(data));
        if (this.menu.setMode) this.menu.setMode('initial');
    }

    private openSettings() {
        if (this.menu.setTabActive) this.menu.setTabActive(-1);
        if (this.menu.setMode) {
            const settings = document.createElement('collab-messages-settings-102025');
            (settings as any)['serviceBase'] = this;
            this.menu.setMode('page', settings);
        }
        return true;
    }

    private openFindTask() {
        if (this.menu.setTabActive) this.menu.setTabActive(-1);
        if (this.menu.setMode) {
            const settings = document.createElement('collab-messages-findtask-102025');
            (settings as any)['serviceBase'] = this;
            this.menu.setMode('page', settings);
        }
        return true;
    }

    private async onCollabEventsCollabMessages(ev: mls.events.IEvent) {

        if (!ev.desc) return;
        this.threadToOpen = '';
        this.taskToOpen = '';

        try {
            const data: ICollabMessageEvent = JSON.parse(ev.desc);
            if (data.type === 'thread-open') {
                if (!data.threadId) return;
                const thread = await getThread(data.threadId);
                if (!thread) return;
                if (data.taskId) this.taskToOpen = data.taskId;

                openService('_102025_serviceCollabMessages', 'left', ev.level);
                const group = thread.group;
                this.threadToOpen = thread.threadId;
                if (group !== this.activeTab) this.activeTab = group as ITabType;
            }
        } catch (err: any) {
            console.error(err.message)
        }

    }

    private onThreadCreate = async (e: Event) => {
        const customEvent = e as CustomEvent;
        const thread = customEvent.detail as mls.msg.Thread;
        if (!thread) return;

        this.userThreads[thread.threadId] = {
            thread: thread,
            users: []
        };

        this.requestUpdate();
    }

    private async checkNotificationPending() {
        const hasPendingMessages = await checkIfNotificationUnread();
        if (hasPendingMessages) {
            changeFavIcon(true);
            this.toogleBadge(true, '_102025_serviceCollabMessages');
        }
    }

}

interface IDataLocal {
    lastTab: ITabType
}

type IThreadData = { [key: string]: IThreadInfo }

interface IThreadInfo {
    thread: mls.msg.Thread,
    users: mls.msg.User[]
}

enum ETabs {
    'CRM' = 0,
    'TASK' = 1,
    'CONNECT' = 2,
    'MOMENTS' = 3,
    'APPS' = 4,
    'Add' = 5,
    'Loading' = 6,
}


type ITabType = 'CRM' | 'TASK' | 'MOMENTS' | 'CONNECT' | 'APPS' | 'Add' | 'Loading';
type IScenery = 'tabs' | 'settings' | 'findTask'
