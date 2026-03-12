/// <mls fileReference="_102025_/l2/collabMessagesSettings.ts" enhancement="_102027_/l2/enhancementLit" />

import { html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { updateUsers, listThreads } from '/_102025_/l2/collabMessagesIndexedDB.js';
import { ServiceBase } from '/_100554_/l2/serviceBase.js';

import {
    loadChatPreferences,
    saveChatPreferences,
    saveNotificationPreferencesAudio,
    loadNotificationPreferencesAudio,
    loadNotificationPreferences,
    registerToken,
    saveNotificationPreferences
} from '/_102025_/l2/collabMessagesHelper.js';

import {
    IChatPreferences,
    TranslateMode,
} from '/_102025_/l2/collabMessagesHelper.js';

import {
    collab_user,
    collab_minus,
    collab_ban,
    collab_dot,
    collab_message,
    collab_bell
} from '/_102025_/l2/collabMessagesIcons.js';

/// **collab_i18n_start** 
const message_pt = {
    loading: 'Carregando...',
    save: 'Salvar',
    status: 'Status',
    userid: 'Id do usuário',
    username: 'Nome do usuário',
    errorUserName: 'Nome do usuário não pode ser vazio',
    successSavingUser: 'Perfil do usuário atualizado com sucesso',
    successSavingChatPref: 'Preferências do chat atualizado com sucesso',
    chatPref: 'Preferências do chat',
    translate: 'Tradução',
    preferLanguage: 'Idioma preferido',
    userTitle: 'Usuário',
    prefNotification: 'Preferências de notificação',
    infoNotification: 'Avisamos quando houver mudanças e novas mensagens, sem pop-ups, só sincronismo, mais velocidade para você',
    moreNotification: 'Saiba mais',
    notificationStatusEnabled: 'Notificações ativadas',
    notificationStatusFailed: 'Não foi possivel ativar as notificações, verificar permissões no browser',
    btnEnableNotifications: 'Ativar notificações',
    soundEnable: 'Ativar som nas notificações',
}

const message_en = {
    loading: 'Loading...',
    save: 'Save',
    status: 'Status',
    userid: 'User Id',
    username: 'UserName',
    errorUserName: 'User name cannot be empty',
    successSavingUser: 'User perfil updated successfully',
    successSavingChatPref: 'Chat preferences updated successfully',
    chatPref: 'Chat Preferences',
    translate: 'Translate',
    preferLanguage: 'Preferred language',
    userTitle: 'User',
    prefNotification: 'Notification Preferences',
    infoNotification: 'We\'ll notify you when there are changes and new messages — no pop-ups, just seamless syncing for faster performance.',
    moreNotification: 'Learn more',
    notificationStatusEnabled: 'Notifications enabled',
    btnEnableNotifications: 'Enable notifications',
    notificationStatusFailed: 'Unable to enable notifications, check browser permissions',
    soundEnable: 'Enable sound for notifications',

}

type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**

@customElement('collab-messages-settings-102025')
export class CollabMessagesSettings100554 extends StateLitElement {

    private msg: MessageType = messages['en'];

    private serviceBase: ServiceBase | undefined;
    private list: mls.msg.ThreadPerformanceCache[] = [];

    @state() userPerfil: mls.msg.User | undefined;
    @state() private chatPreferences: IChatPreferences = {
        translationMode: 'icon',
        language: '',
        threadMaintenance: ''
    };

    @state() notificationPreferences?: NotificationPermission | null;
    @state() audioEnabled: boolean = false;

    @property() labelOk: string = '';
    @property() labelError: string = '';
    @property() labelOkPref: string = '';
    @property() labelErrorPref: string = '';
    @property() labelOkNotification: string = '';
    @property() labelErrorNotification: string = '';

    @property() isSavingUser: boolean = false;
    @property() isSavingChat: boolean = false;
    @property() isSavingNotification: boolean = false;

    @query('.avatar img') userAvatarEl: HTMLImageElement | undefined;

    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);
        this.list = await listThreads();
        this.userPerfil = await this.getUserPerfil();
        this.chatPreferences = loadChatPreferences();
        const audioPref = loadNotificationPreferencesAudio();
        this.audioEnabled = audioPref;
    }

    updated() {
        const select = this.renderRoot.querySelector('select#selectThread') as any;
        if (select) {
            select.value = this.chatPreferences?.threadMaintenance ?? '';
        }
    }

    render() {

        const lang = this.getMessageKey(messages);
        this.msg = messages[lang];
        return html`
            ${this.renderUser()}
            ${this.renderChatPreferences()}
            ${this.renderPreferencesNotifications()}

        `;
    }

    private renderUser() {

        const avatarUrl = this.userPerfil?.avatar_url;
        const iconByStatus = {
            'active': collab_dot,
            'deleted': collab_minus,
            'blocked': collab_ban,
            '': html``,
        }

        const icon = iconByStatus[this.userPerfil?.status || '']

        return html`
         <div >
        <h4>${collab_user} ${this.msg.userTitle}</h4>
        <div class="section user">
          <div class="user-details">
            <div class="avatar">
                ${avatarUrl
                ? html`<img src="${avatarUrl}" alt="Avatar" />`
                : html`<div class="avatar-placeholder">${collab_user}</div>`}
                <a @click=${(e: MouseEvent) => { e.preventDefault(); this.refreshAvatar(); }} href="#"> Atualizar</a>
            </div>
            <div class="user-info">
                <div class="user-info-item">
                    <label>${this.msg.username}</label>
                    <input
                        .value=${this.userPerfil?.name ?? ''} 
                        type="text" 
                        @input=${this.handleNameInput}
                    />
                </div>
                <div class="user-info-item">
                    <label>${this.msg.userid}</label>
                    <span> ${this.userPerfil?.userId ?? ''}  </span>
                </div>
                <div class="user-info-item status">
                    <label>${this.msg.status}</label>
                    <span class=${this.userPerfil?.status}> ${this.userPerfil?.status ?? 'N/A'} ${icon} </span>
                </div>
            
            </div>
        </div>
            <div class="user-info-item action">
                <button
                    @click=${this.handleSave}
                    ?disabled=${this.isSavingUser}
                >
                    ${this.isSavingUser ? html`<span class="loader"></span>` : this.msg.save}
                </button>
            </div>
            ${this.labelOk ? html`<small class="saving-ok">${this.labelOk}<small>` : ''}
            ${this.labelError ? html`<small class="saving-error">${this.labelError}<small>` : ''}      
      </div>
        
        `
    }

    private renderChatPreferences() {
        return html`
    <div>
        <h4>${collab_message} ${this.msg.chatPref}</h4>
        <div class="section chat-preferences">

            <div class="chat-config-item">
                <label for="translationMode">${this.msg.translate}:</label>
                <select
                    id="translationMode"
                    @change=${this.handleTranslationModeChange}
                    .value=${this.chatPreferences?.translationMode ?? 'icon'}
                >
                    <option value="none">none</option>
                    <option value="icon">icon</option>
                    <option value="text">text</option>
                    <option value="iconText">icon + text</option>
                    <option value="trace">trace</option>

                </select>
            </div>
            <div class="chat-config-item">
                <label>${this.msg.preferLanguage}:</label>
                <input
                    @input=${this.handleLanguageInput}
                    .value=${this.chatPreferences?.language ?? ''}
                    type="text"
                />
            </div>
            <div class="chat-config-item action">
                <button
                    @click=${this.handleSaveChatPref}
                    ?disabled=${this.isSavingChat}
                >
                    ${this.isSavingChat ? html`<span class="loader"></span>` : this.msg.save}
                </button>
            </div>
            ${this.labelOkPref ? html`<small class="saving-ok">${this.labelOkPref}<small>` : ''}
            ${this.labelErrorPref ? html`<small class="saving-error">${this.labelErrorPref}<small>` : ''}    
        </div>
    </div>`;
    }


    private renderPreferencesNotifications() {
        this.notificationPreferences = this.getNotificationStatus();
        return html`
        <div>
            <h4>${collab_bell} ${this.msg.prefNotification}</h4>
            <div class="section notification-preferences">
            ${this.notificationPreferences === 'granted' ?
                html`
                        <div>${this.msg.notificationStatusEnabled}</div>
                        ${this.renderReadMore()}

                    ` :
                html`
                    <button
                        @click=${this.onEnabledNotifications}
                        ?disabled=${this.isSavingNotification}
                    >
                        ${this.isSavingNotification ? html`<span class="loader"></span>` : this.msg.btnEnableNotifications}
                    </button>
                    <br>
                    ${this.labelOkNotification ? html`<small class="saving-ok">${this.labelOkNotification}<small>` : ''}
                    ${this.labelErrorNotification ? html`<small class="saving-error">${this.labelErrorNotification}<small>` : ''}   
                    ${this.renderReadMore()}
                    `
            }

            <div>

            <div class="notification-audio-config">
                <label>
                    <input 
                        type="checkbox" 
                        .checked=${this.audioEnabled} 
                        @change=${this.handleAudioToggle}
                    />
                    ${this.msg.soundEnable}
                </label>
            </div>
        </div>

        `
    }

    private getNotificationStatus(): NotificationPermission | null {
        const notificationPreferences = loadNotificationPreferences();

        if ('Notification' in window) {
            const permission = Notification.permission;
            if (permission === this.notificationPreferences) return notificationPreferences;
            if (permission === 'granted' && notificationPreferences === 'denied') {
                saveNotificationPreferences('default');
                return 'default'
            }
            if (permission === 'denied' && notificationPreferences === 'granted') {
                saveNotificationPreferences('denied');
                return 'default'
            }
        }

        return notificationPreferences;
    }

    private renderReadMore() {
        return html`
            <details>
                <summary>${this.msg.moreNotification}</summary>
                <div>
                    <span>${this.msg.infoNotification}</span>
                </div>   
            </details>
         
        `
    }

    private handleAudioToggle(e: Event) {
        const target = e.target as HTMLInputElement;
        this.audioEnabled = target.checked;
        saveNotificationPreferencesAudio(this.audioEnabled);
    }

    private async onEnabledNotifications() {
        this.labelErrorNotification = '';
        this.labelOkNotification = '';

        this.isSavingNotification = true;
        try {
            saveNotificationPreferences('default');
            const token = await registerToken();
            this.notificationPreferences = loadNotificationPreferences();
            this.isSavingNotification = false;
            if (token === null) this.labelOkNotification = this.msg.notificationStatusFailed;
            else this.labelOkNotification = this.msg.notificationStatusEnabled;
        } catch (err: any) {
            this.isSavingNotification = false;
            console.error('Error on enable notificatin:', err.message);
            this.labelErrorNotification = err.message;
        }

    }

    private refreshAvatar() {
        const collabInit = document.querySelector('collab-init-100554')
        if (!collabInit) return;
        const url = collabInit.getAttribute('avatarUrl');
        if (url && this.userPerfil) {
            this.userPerfil.avatar_url = url;
            this.requestUpdate();
        }
    }

    private async getUserPerfil() {
        try {
            const response = await mls.api.msgGetUserUpdate({ userId: "" });
            return response.user;
        } catch (err: any) {
            this.serviceBase?.setError(err.message);
            throw new Error(err.message);
        }
    }

    private async handleSave() {

        this.labelError = '';
        this.labelOk = '';


        if (!this.userPerfil || !this.userPerfil?.name) {
            this.labelError = this.msg.errorUserName
            return;
        }

        this.isSavingUser = true;

        try {
            const response = await mls.api.msgUpdateUserDetails({
                userId: this.userPerfil.userId,
                avatar_url: this.userPerfil.avatar_url,
                name: this.userPerfil.name,
                status: this.userPerfil.status,
                deviceId: this.userPerfil.notifications ? this.userPerfil.notifications[0].deviceId : '',
                notificationToken: this.userPerfil.notifications ? this.userPerfil.notifications[0].notificationToken : '',
            });

            if (response.statusCode !== 200) {
                this.labelError = `${response.msg}`;
                this.isSavingUser = false;
                return;
            }
            this.labelOk = `${this.msg.successSavingUser}`;
            await updateUsers([response.user]);
            this.isSavingUser = false;

        } catch (error: any) {
            console.error('Error on update perfil:', error);
            this.labelError = error.message;
            this.isSavingUser = false;
        }
    }

    private async handleSaveChatPref() {

        this.labelErrorPref = '';
        this.labelOkPref = '';
        this.isSavingChat = true;

        try {
            saveChatPreferences(this.chatPreferences);
            this.labelOkPref = `${this.msg.successSavingChatPref}`;
            this.isSavingChat = false;

        } catch (error: any) {
            console.error('Error on update chat preferences:', error);
            this.labelErrorPref = error.message;
            this.isSavingChat = false;
        }
    }

    private handleTranslationModeChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        this.chatPreferences = {
            ...this.chatPreferences,
            translationMode: select.value as TranslateMode
        };
    }

    private handleLanguageInput(e: Event) {
        const target = e.target as HTMLInputElement;
        this.chatPreferences = {
            ...this.chatPreferences,
            language: target.value
        };
    }

    private handleNameInput(e: Event) {
        if (!this.userPerfil) return;
        const target = e.target as HTMLInputElement;
        this.userPerfil.name = target.value;
    }
}

