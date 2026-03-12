/// <mls fileReference="_102025_/l2/collabMessagesAdd.ts" enhancement="_blank" /> 

// Do not change – automatically generated code. 

export const asis: mls.defs.AsIs = {
  "meta": {
    "fileReference": "_102025_/l2/collabMessagesAdd.ts",
    "componentType": "organism",
    "componentScope": "appFrontEnd",
    "languages": [
      "en",
      "pt"
    ]
  },
  "references": {
    "webComponents": [
      "collab-messages-input-tag-102025"
    ],
    "imports": [
      {
        "ref": "lit",
        "dependencies": [
          {
            "name": "html",
            "type": "function"
          },
          {
            "name": "css",
            "type": "function"
          }
        ]
      },
      {
        "ref": "lit/decorators.js",
        "dependencies": [
          {
            "name": "customElement",
            "type": "function"
          },
          {
            "name": "property",
            "type": "function"
          },
          {
            "name": "state",
            "type": "function"
          },
          {
            "name": "query",
            "type": "function"
          }
        ]
      },
      {
        "ref": "/_100554_/l2/stateLitElement.js",
        "dependencies": [
          {
            "name": "StateLitElement",
            "type": "class"
          }
        ]
      },
      {
        "ref": "/_100554_/l2/aiAgentHelper.js",
        "dependencies": [
          {
            "name": "notifyThreadChange",
            "type": "function"
          },
          {
            "name": "notifyThreadCreate",
            "type": "function"
          },
          {
            "name": "getTemporaryContext",
            "type": "function"
          }
        ]
      },
      {
        "ref": "/_100554_/l2/aiAgentOrchestration.js",
        "dependencies": [
          {
            "name": "loadAgent",
            "type": "function"
          },
          {
            "name": "executeBeforePrompt",
            "type": "function"
          }
        ]
      },
      {
        "ref": "/_100554_/l2/aiAgentBase.js",
        "dependencies": [
          {
            "name": "IAgent",
            "type": "interface"
          }
        ]
      },
      {
        "ref": "/_102025_/l2/collabMessagesIndexedDB.js",
        "dependencies": [
          {
            "name": "addThread",
            "type": "function"
          },
          {
            "name": "updateThread",
            "type": "function"
          }
        ]
      },
      {
        "ref": "/_102025_/l2/collabMessagesHelper.js",
        "dependencies": [
          {
            "name": "getUserId",
            "type": "function"
          },
          {
            "name": "getDmThreadByUsers",
            "type": "function"
          },
          {
            "name": "addMessage",
            "type": "function"
          },
          {
            "name": "createThreadDM",
            "type": "function"
          }
        ]
      },
      {
        "ref": "/_102025_/l2/collabMessagesInputTag.js",
        "dependencies": [
          {
            "name": "CollabMessagesInputTag",
            "type": "component"
          }
        ]
      },
      {
        "ref": "/_102025_/l2/collabMessagesInputTag.js"
      }
    ]
  },
  "codeInsights": {
    "todos": [],
    "securityWarnings": [],
    "unusedImports": [],
    "deadCodeBlocks": [],
    "accessibilityIssues": [],
    "i18nWarnings": [],
    "performanceHints": []
  },
  "asIs": {
    "semantic": {
      "generalDescription": "LitElement component for adding new message threads (DM or Channel) with support for bot configuration, AI avatar generation, and multilingual settings",
      "businessCapabilities": [
        "Create direct message (DM) threads between users",
        "Create public/private/company/team channel threads",
        "Configure thread metadata (name, group, visibility)",
        "Set up automatic translation for multiple languages",
        "Install and configure AI agent bots in threads",
        "Set initial welcome messages for channels",
        "Generate thread avatars using AI",
        "Validate thread creation forms"
      ],
      "technicalCapabilities": [
        "LitElement-based reactive web component",
        "Integration with messaging API (mls.api.msg*)",
        "IndexedDB local storage operations",
        "Dynamic agent module loading and execution",
        "Form validation and error handling",
        "Internationalization (i18n) support for EN/PT",
        "State management using Lit decorators"
      ],
      "implementedFeatures": [
        "DM thread creation with user selection",
        "Channel thread creation with name validation (must start with #)",
        "Thread visibility configuration (public, private, company, team)",
        "Thread group selection (CRM, TASK, DOCS, CONNECT, APPS)",
        "Language tag input for auto-translation",
        "Agent bot selection and configuration",
        "Initial message configuration for channels",
        "AI avatar generation via agent execution",
        "Form validation with error messaging"
      ],
      "constraints": [
        "Channel names must start with '#' character",
        "DM threads require valid user selection",
        "User ID is required for thread creation",
        "Only one DM thread allowed per user pair"
      ]
    }
  }
}
    
