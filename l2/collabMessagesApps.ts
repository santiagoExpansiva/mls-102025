/// <mls fileReference="_102025_/l2/collabMessagesApps.ts" enhancement="_102027_/l2/enhancementLit" />


import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getProjectConfig } from '/_100554_/l2/libCommom.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';
import { collabImport } from '/_100554_/l2/collabImport.js';
import { getPath } from '/_102027_/l2/utils.js';
import '/_102025_/l2/collabMessagesAppsMenu.js'; 

@customElement('collab-messages-apps-102025')
export class CollabMessagesApps extends CollabLitElement {

    @state() menuModules: IMenuModule[] = [];

    async firstUpdated(_changedProperties: Map<PropertyKey, unknown>) {
		super.firstUpdated(_changedProperties);
		await this.getModules();
	}

    render() {
        return html`
			<div class="menu-container">
				<collab-messages-apps-menu-102025
					.menuModules=${this.menuModules} 
					menuTitle="Módulos"
					keyFavoritesLocalStorage="modulesMenuFavorites"
					identifier=${mls.actualProject?.toString() || ''}
					@menu-selected=${(e: CustomEvent) => this.handleMenuClick(e)}
				>
				</collab-messages-apps-menu-102025>
			</div>
		`;
    }

    private handleMenuClick(ev: CustomEvent) {
        const item = ev.detail;
        window.top?.postMessage({
            type: 'loadPage',
            target: item.target,
            project: item.project,
            moduleName: item.module,
            modulePath: item.path,
            pageName: item.pageName,
        })

    }

    private async getModules() {
        const actualProject = mls.actualProject;
        if (!actualProject) return;
        const moduleProject = await getProjectConfig(actualProject);
        if (!moduleProject?.modules || !Array.isArray(moduleProject.modules)) return;
        const modules: IMenuModule[] = [];

        for await (let _module of moduleProject.modules) {
            if (!_module) continue;
            const moduleMenu: IMenuModule = {
                menu: [],
                icon: _module.icon || '',
                name: _module.name,
                path: _module.path,
                project: 0
            };

            const isDep = _module.path.startsWith('_');
            let prjImport = actualProject;
            let pathImport = _module.path?.replace('/', '_');

            if (isDep) {
                const iPath = getPath(_module.path);
                if (!iPath || !iPath.project) continue;
                const { folder, project, shortName } = iPath;
                prjImport = project;
                pathImport = folder ? folder + '/' + shortName : shortName;
                moduleMenu.path = pathImport;
                pathImport = pathImport.replace('/', '_');
            }
            moduleMenu.project = prjImport;


            const moduleInstance = await collabImport({ folder: pathImport, project: prjImport, shortName: 'module', extension: '.ts' });
            const moduleConfig = moduleInstance?.moduleConfig;
            if (!moduleConfig?.menu || moduleConfig.menu.length === 0) continue;
            modules.push(moduleMenu);


            moduleConfig.menu.forEach((m: IModuleMenuItem) => {
                const buildUrls = (item: IModuleMenuItem): IModuleMenuItem => {
                    const url = `_${actualProject}_${_module.path}/${item.pageName}`;
                    const newItem: IModuleMenuItem = { ...item, url };

                    if (item.children && item.children.length > 0) {
                        newItem.children = item.children.map(child => buildUrls(child));
                    }

                    return newItem;
                };

                const newItem = buildUrls(m);
                moduleMenu.menu.push(newItem);
            });
        }

        this.menuModules = [...modules];
    }
}

interface IMenuModule {
    name: string;
    project: number,
    icon: string;
    path: string,
    menu: IModuleMenuItem[];
}

interface IModuleMenuItem {
    title: string;
    icon: string;
    url: string,
    pageName: string;
    target: string,
    children: IModuleMenuItem[]
}