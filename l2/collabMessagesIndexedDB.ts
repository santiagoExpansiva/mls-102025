/// <mls fileReference="_102025_/l2/collabMessagesIndexedDB.ts" enhancement="_blank" />

const MAXMESSAGESBYTHREAD = 100;
const VERSION = 5;

export function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("msgDB", VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains("threads")) {
                const threadStore = db.createObjectStore("threads", { keyPath: "threadId" });
                threadStore.createIndex("byName", "name", { unique: false });
            } else {
                const threadStore = (event.target as IDBOpenDBRequest).transaction!.objectStore("threads");
                if (!threadStore.indexNames.contains("byName")) {
                    threadStore.createIndex("byName", "name", { unique: false });
                }
            }

            if (!db.objectStoreNames.contains("poolings")) {
                const poolingStore = db.createObjectStore("poolings", { keyPath: "taskId" });

                poolingStore.createIndex("byUserId", "userId", { unique: false });
                poolingStore.createIndex("byStartAt", "startAt", { unique: false });
            }

            if (!db.objectStoreNames.contains("users")) {
                db.createObjectStore("users", { keyPath: "userId" });
            }

            if (!db.objectStoreNames.contains("tasks")) {
                db.createObjectStore("tasks", { keyPath: "PK" });
            }


            let messageStore: IDBObjectStore;
            if (!db.objectStoreNames.contains("messages")) {
                messageStore = db.createObjectStore("messages", { keyPath: "messageId" });
            } else {
                messageStore = (event.target as IDBOpenDBRequest).transaction!.objectStore("messages");
            }

            if (!messageStore.indexNames.contains("byThreadId")) {
                messageStore.createIndex("byThreadId", "threadId", { unique: false });
            }

            if (!messageStore.indexNames.contains("byThreadId_orderAt")) {
                messageStore.createIndex("byThreadId_orderAt", ["threadId", "orderAt"], { unique: false });
            }

        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to open IndexedDB");

    });
}

export async function addMessages(messages: mls.msg.MessagePerformanceCache[]): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        for (const message of messages) {
            const newMessage = {
                ...{ ...message, lastSync: getCompactUTC() },
                messageId: `${message.threadId}/${message.createAt}`,
            };
            store.put(newMessage);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Failed to add messages");
        tx.onabort = () => reject("Transaction aborted while saving messages");
    });
}

export async function addMessage(message: mls.msg.MessagePerformanceCache): Promise<void> {

    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readonly");
        const store = tx.objectStore("messages");
        const index = store.index("byThreadId_orderAt");

        const messagesInThread: mls.msg.MessagePerformanceCache[] = [];
        const range = IDBKeyRange.bound([message.threadId, ''], [message.threadId, '\uffff']);
        const request = index.openCursor(range);

        request.onsuccess = async (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                messagesInThread.push(cursor.value);
                cursor.continue();
            } else {

                const excess = messagesInThread.length - MAXMESSAGESBYTHREAD + 1;
                const messagesToDelete = excess > 0
                    ? messagesInThread.sort((a, b) => a.orderAt.localeCompare(b.orderAt)).slice(0, excess)
                    : [];

                try {

                    if (messagesToDelete.length > 0) {
                        deleteMessagesAndTasks(messagesToDelete);
                    }

                    const txWrite = db.transaction("messages", "readwrite");
                    const storeWrite = txWrite.objectStore("messages");

                    const newMessage = {
                        ...{ ...message, lastSync: getCompactUTC() },
                        messageId: `${message.threadId}/${message.createAt}`,
                    };

                    storeWrite.put(newMessage);
                    txWrite.oncomplete = () => resolve();
                    txWrite.onerror = () => reject("Failed to add message");
                    txWrite.onabort = () => reject("Transaction was aborted");

                } catch (err) {
                    reject(err);
                }
            }
        };

        request.onerror = () => reject("Failed to read thread messages");
    });
}

export async function updateMessage(message: mls.msg.Message): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");

        const messageId = `${message.threadId}/${message.createAt}`;

        const getRequest = store.get(messageId);

        getRequest.onsuccess = () => {
            if (!getRequest.result) {
                reject(`Message not found (ID: ${messageId}).`);
                return;
            }

            const updatedMessage = {
                ...getRequest.result,
                ...message,
                messageId,
            };

            const updateRequest = store.put(updatedMessage);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject("Failed to update message.");
        };
        getRequest.onerror = () => reject("Failed to fetch message for update.");
        tx.onabort = () => reject("Transaction was aborted.");
    });
}

export async function deleteAllMessagesFromThread(threadId: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        const index = store.index("byThreadId_orderAt");

        const range = IDBKeyRange.bound([threadId, ''], [threadId, '\uffff']);
        const request = index.openCursor(range);
        const messagesInThread: mls.msg.MessagePerformanceCache[] = [];

        request.onsuccess = async (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                messagesInThread.push(cursor.value);
                cursor.continue();
            } else {

                try {
                    if (messagesInThread.length > 0) await deleteMessagesAndTasks(messagesInThread);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }
        };

        request.onerror = () => reject("Failed to delete thread messages");
        tx.onerror = () => reject("Delete transaction failed");
        tx.onabort = () => reject("Delete transaction was aborted");
    });
}


export async function getMessage(messageId: string): Promise<mls.msg.MessagePerformanceCache | undefined> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readonly");
        const store = tx.objectStore("messages");
        const request = store.get(messageId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch message");
    });
}

export async function getMessagesByThreadId(
    threadId: string,
    limit: number = 15,
    offset: number = 0
): Promise<mls.msg.MessagePerformanceCache[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readonly");
        const store = tx.objectStore("messages");
        const index = store.index("byThreadId");

        const range = IDBKeyRange.only(threadId);
        const request = index.openCursor(range, "prev"); // "prev" = mais recentes primeiro

        const messages: mls.msg.MessagePerformanceCache[] = [];
        let skipped = 0;

        request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor || messages.length >= limit) {
                resolve(messages);
                return;
            }

            if (skipped < offset) {
                skipped++;
                cursor.continue();
                return;
            }

            messages.push(cursor.value);
            cursor.continue();
        };

        request.onerror = () => reject("Failed to fetch paginated messages for the thread");

    });
}


export async function getAllMessagesByThreadId(threadId: string): Promise<mls.msg.MessagePerformanceCache[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("messages", "readonly");
        const store = tx.objectStore("messages");
        const index = store.index("byThreadId");
        const request = index.getAll(IDBKeyRange.only(threadId));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch messages by threadId");

    });
}


async function deleteMessagesAndTasks(messages: mls.msg.MessagePerformanceCache[]): Promise<void> {

    const db = await openDB();
    const tx = db.transaction(["messages", "tasks"], "readwrite"); // transação para ambas stores
    const messageStore = tx.objectStore("messages");

    for (const msg of messages) {
        messageStore.delete(`${msg.threadId}/${msg.createAt}`,);
    }

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });

    for await (const msg of messages) {
        if (msg.taskId) {
            try {
                await deleteTask(msg.taskId);
            } catch (err) {
                console.warn(`Could not delete task ${msg.taskId}:`, err);
            }
        }
    }
}

export async function addOrUpdateTask(task: mls.msg.TaskData): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");
        store.put(task);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Failed to add task");
        tx.onabort = () => reject("Transaction was aborted");

    });
}

export async function getTask(taskId: string): Promise<mls.msg.TaskData | undefined> {
    const db = await openDB();
    const tx = db.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");

    return new Promise((resolve, reject) => {
        const request = store.get(taskId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch task");

    });
}

export async function deleteTask(taskId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");

        const request = store.delete(taskId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Failed to delete task");
        tx.onabort = () => reject("Transaction was aborted");

    });
}

export async function listThreads(): Promise<mls.msg.ThreadPerformanceCache[]> {
    const db = await openDB();
    const tx = db.transaction("threads", "readonly");
    const store = tx.objectStore("threads");
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to list threads");

    });
}

export async function addThread(thread: mls.msg.Thread): Promise<mls.msg.ThreadPerformanceCache> {
    const db = await openDB();

    const threadCache: mls.msg.ThreadPerformanceCache = {
        ...thread,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        lastSync: ''
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite");
        const store = tx.objectStore("threads");
        store.put(threadCache);
        tx.oncomplete = () => resolve(threadCache);
        tx.onerror = () => reject("Failed to add thread");
        tx.onabort = () => reject("Transaction was aborted");

    });
}



export async function updateLastMessageReadTime(threadId: string, lastMessageReadTime: string): Promise<IDBThreadPerformanceCache> {

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite");
        const store = tx.objectStore("threads");
        const request = store.get(threadId);

        request.onsuccess = () => {
            let threadDb = request.result;

            if (!threadDb) {
                reject(`Thread not found (ID: ${threadId}).`);
                return;
            }

            threadDb = { ...threadDb, lastMessageReadTime }
            const updateRequest = store.put(threadDb);
            updateRequest.onsuccess = () => resolve(threadDb);
            updateRequest.onerror = () => reject("Failed to update the thread");

        };

        request.onerror = () => reject("Failed to fetch the thread");

    });
}

export async function updateThreadPendingTasks(
    threadId: string,
    taskId?: string
): Promise<IDBThreadPerformanceCache> {

    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction("threads", "readwrite");
        const store = tx.objectStore("threads");
        const getRequest = store.get(threadId);

        let updatedThread: mls.msg.ThreadPerformanceCache;
        getRequest.onerror = () => reject("Failed to fetch thread");

        getRequest.onsuccess = () => {

            const threadDb = getRequest.result;

            if (!threadDb) {
                reject(`Thread not found (ID: ${threadId})`);
                return;
            }

            let pendingTasks = [...(threadDb.pendingTasks ?? [])];
            if (!taskId) pendingTasks = [];
            else {
                const index = pendingTasks.indexOf(taskId);
                if (index >= 0) pendingTasks.splice(index, 1);
                else pendingTasks.push(taskId);
            }

            updatedThread = {
                ...threadDb,
                pendingTasks
            };

            store.put(updatedThread);
        };

        tx.oncomplete = () => resolve(updatedThread);
        tx.onerror = () => reject(tx.error || "Transaction failed");
        tx.onabort = () => reject(tx.error || "Transaction aborted");

    });
}

export async function updateThread(
    threadId: string,
    thread: mls.msg.Thread,
    lastMessage?: string,
    lastMessageTime?: string,
    unreadCount?: number,
    lastSync?: string,
): Promise<IDBThreadPerformanceCache> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite");
        const store = tx.objectStore("threads");
        const request = store.get(threadId);

        request.onsuccess = () => {
            let threadDb = request.result;

            if (!threadDb) {
                reject(`Thread not found (ID: ${threadId}).`);
                return;
            }

            threadDb = { ...threadDb, ...thread }
            if (lastMessage !== undefined) threadDb.lastMessage = lastMessage;
            if (lastMessageTime !== undefined) threadDb.lastMessageTime = lastMessageTime;
            if (unreadCount !== undefined) threadDb.unreadCount = unreadCount;
            if (lastSync !== undefined) threadDb.lastSync = lastSync;
            
            const updateRequest = store.put(threadDb);
            updateRequest.onsuccess = () => resolve(threadDb);
            updateRequest.onerror = () => reject("Failed to update the thread");

        };

        request.onerror = () => reject("Failed to fetch the thread");

    });
}

export async function updateThreads(threadsFromServer: mls.msg.Thread[]): Promise<void> {

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readwrite");
        const store = tx.objectStore("threads");

        try {
            for (const thread of threadsFromServer) {

                const threadCache: mls.msg.ThreadPerformanceCache = {
                    ...thread,
                    lastMessage: '',
                    lastMessageTime: '',
                    unreadCount: 0,
                    lastSync: ''
                }

                store.put(threadCache);
            }
        } catch (err) {
            reject(`Failed to insert threads: ${err}`);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Synchronization transaction failed");
        tx.onabort = () => reject("Synchronization transaction was aborted");

    });
}

export async function getThread(threadId: string): Promise<IDBThreadPerformanceCache | undefined> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readonly");
        const store = tx.objectStore("threads");
        const request = store.get(threadId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch thread");

    });
}

export async function getThreadByName(threadName: string): Promise<IDBThreadPerformanceCache | undefined> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readonly");
        const store = tx.objectStore("threads");
        const index = store.index("byName");
        const request = index.get(threadName);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch thread by name");

    });
}

export async function getAllThreads(): Promise<IDBThreadPerformanceCache[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("threads", "readonly");
        const store = tx.objectStore("threads");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to list all threads");

    });
}

export async function cleanupThreads(validThreadIds: string[]): Promise<void> {
    const db = await openDB();

    const existingThreads = await getAllThreads();
    const threadsToDelete = existingThreads.filter(
        (t) => !validThreadIds.includes(t.threadId) && (t.unreadCount === 0 || !t.unreadCount) // Delete only if there are no pending operations
    );

    if (threadsToDelete.length === 0) return;

    for (const thread of threadsToDelete) {
        try {

            await deleteAllMessagesFromThread(thread.threadId);
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction("threads", "readwrite");
                const store = tx.objectStore("threads");
                const request = store.delete(thread.threadId);

                request.onsuccess = () => resolve();
                request.onerror = () => reject("Failed to delete thread");
                tx.onabort = () => reject("Transaction was aborted while deleting the thread");

            });
        } catch (err) {
            console.warn(`Could not remove thread ${thread.threadId}:`, err);

        }
    }
}

export async function listUsers(): Promise<mls.msg.User[]> {
    const db = await openDB();
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to list users");

    });
}

export async function addUser(user: mls.msg.User): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("users", "readwrite");
        const store = tx.objectStore("users");
        store.put(user);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Failed to add user");
        tx.onabort = () => reject("User transaction was aborted");

    });
}

export async function updateUsers(usersFromServer: mls.msg.User[]): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("users", "readwrite");
        const store = tx.objectStore("users");

        try {
            for (const user of usersFromServer) {
                store.put(user);
            }
        } catch (err) {
            reject(`Failed to insert users: ${err}`);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("User synchronization transaction failed");
        tx.onabort = () => reject("User synchronization transaction was aborted");

    });
}

export async function getUser(userId: string): Promise<mls.msg.User | undefined> {
    const db = await openDB();
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");

    return new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch user");
    });
}

export async function addPooling(pooling: PoolingTask): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("poolings", "readwrite");
        const store = tx.objectStore("poolings");

        store.put(pooling);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Failed to add pooling");
        tx.onabort = () => reject("Transaction was aborted");

    });
}

export async function deletePooling(taskId: string): Promise<void> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("poolings", "readwrite");
        const store = tx.objectStore("poolings");

        store.delete(taskId);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject("Failed to delete pooling");
    });
}

export async function getPooling(taskId: string): Promise<PoolingTask | undefined> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("poolings", "readonly");
        const store = tx.objectStore("poolings");

        const request = store.get(taskId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to fetch pooling");

    });
}

export async function listPoolings(): Promise<PoolingTask[]> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("poolings", "readonly");
        const store = tx.objectStore("poolings");

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to list poolings");

    });
}

export function getCompactUTC() {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export interface IDBThreadPerformanceCache extends mls.msg.ThreadPerformanceCache {
    pendingTasks?: string,
}

export interface PoolingTask {
    taskId: string;
    userId: string;
    startAt: string; // mesmo padrão UTC compactado que você já usa
}
