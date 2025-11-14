import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallets, useSignAndExecuteTransaction, useConnectWallet, useCurrentAccount, useIotaClient, useIotaClientQuery } from "@iota/dapp-kit";

import { Transaction } from "@iota/iota-sdk/transactions";
import { STATE_OBJECT, MODULE, PACKAGE_ID } from "./networkConfig";


// Utility to parse a string/number to a BigNumber (IOTA uses 1e9 for MIOTA)
export function ParseBigNumber(value: string | number): number {
    // Parse to number and convert to IOTA base unit (1 MIOTA = 1e6 IOTA, but 1e9 is commonly used for Gwei-like)
    return Number(value) / 1e9;
}

// Utility to wrap a number to IOTA base unit
export function WrapBigNumber(value: string | number): number {
    // Convert to IOTA base unit
    return Number(value) * 1e9;
}


// Context for IOTA utilities
const IOTAContext = createContext({
    ParseBigNumber,
    WrapBigNumber,
    Balance: "",
    currentWalletAddress: "",
    sendTransaction: async (tx: Transaction, functionName: string, args: any[]) => null,
    sendNative: async (to: string, amount: number) => null,
    daos: [],
    getAllDaos: async () => [],
    getGoalsForDao: async (daoId: number) => [],
    getUserBadge: async (wallet: string) => null,
    queryEvent: async (digest: string, eventType: string) => null,
    sleep: async (ms: number) => { return new Promise((resolve) => setTimeout(resolve, ms)); },
    contract: null,
    getGoalUri: async (id: number) => "",
    getAllIdeasByGoalId: async (id: number) => [],
    getIdeasIdByIdeasUri: async (uri: string) => 0,
    getIdeasUri: async (id: number) => "",
    getGoalIdFromIdeasUri: async (uri: string) => 0,
    getIdeasVotesFromGoal: async (goalId: number, id: number) => [],
    getIdeasDonation: async (id: number) => 0,
    getMsgIDs: async (id: number) => [],
    getAllMessages: async (id: number) => "",
    getReplyIDs: async (id: number) => [],
    getAllReplies: async (id: number) => "",
    getMessageIds: async () => 0,
    getReplyIds: async () => 0
});

export const useIOTA = () => useContext(IOTAContext);

// standalone helper export
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

let running = false;

export const IOTAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [Balance, setBalance] = useState("");
    const [daos, setDaos] = useState([]);
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();


    // dApp Kit hooks (safe: this component is client-only)
    const wallets = useWallets();
    const currentAccount = useCurrentAccount();
    const connect = useConnectWallet();
    const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);

    const client = useIotaClient();

    async function sendTransaction(tx: Transaction, functionName: string, args: any[]) {
        if (!client) throw new Error("IOTA dapp-kit client not found");



        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::${functionName}`,
            arguments: [tx.object(STATE_OBJECT), ...args],
            
        });


        return new Promise((resolve, reject) => {
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        resolve(result);
                    },
                    onError: (error) => {
                        console.error("Transaction failed", error);
                        reject(error);
                    },
                },
            );
        });

    }
    // Send native IOTA tokens to a destination address
    async function sendNative(to: string, amount: number) {
        if (!client) throw new Error("IOTA dapp-kit client not found");
        if (!currentWalletAddress) throw new Error("No wallet connected");

        const tx = new Transaction();
        try {
            // amount expected in whole IOTA units (not MIOTA). WrapBigNumber converts decimals if needed.
            const amountBase = WrapBigNumber(amount);

            // Use the SDK-supported primitives: split the gas coin and transfer the resulting coin object to the recipient.
            // splitCoins returns a result (or array) that can be passed to transferObjects.
            const splitResults = tx.splitCoins(tx.gas, [String(amountBase)]);

            // splitResults may be an array-like result; pick the first element for a single amount transfer
            const coinToTransfer = Array.isArray(splitResults) ? splitResults[0] : splitResults;

            tx.transferObjects([coinToTransfer], to);

            return await new Promise((resolve, reject) => {
                signAndExecute({ transaction: tx }, {
                    onSuccess: (result) => resolve(result),
                    onError: (error) => reject(error),
                });
            });
        } catch (e) {
            console.error('sendNative error', e);
            throw e;
        }
    }
    const { data: balanceData, refetch } = useIotaClientQuery(
        'getAllBalances',
        { owner: currentWalletAddress },
        { enabled: !!currentWalletAddress, gcTime: 10000 }
    );
    useEffect(() => {

        if (balanceData && balanceData[0].totalBalance !== undefined) {
            setBalance(ParseBigNumber(balanceData[0].totalBalance) + " IOTA");
        } else {
            setBalance("Loading...");
        }
    }, [balanceData]);

    useEffect(() => {
        if (!running && currentWalletAddress === null) {
            running = true;
            fetchInfo();
        }
    }, [wallets, currentAccount]);
    async function queryEvent(digest: string, eventType: string) {
        const tx = await client.getTransactionBlock({ digest, options: { showEvents: true } });
        return tx.events?.find(e => e.type === eventType);
    }
    async function fetchStateData(){
        if (!client) throw new Error("IOTA dapp-kit client not found");

        const stateData = await client.getObject({
            id: STATE_OBJECT,
            options: { showContent: true },
        });
        return stateData;
    }

    // Wrapper around devInspectTransactionBlock to handle nodes that reject a missing/invalid sender
    async function safeDevInspect(tx: Transaction) {
        if (!client) throw new Error("IOTA client not available");
        return await client.devInspectTransactionBlock({ transactionBlock: tx, sender: currentWalletAddress });

    }

    // Helper to normalize devInspect results across SDK versions and extract the primary return value.
    function extractDevInspectValue(result: any): any {
        if (!result) return null;
        // Newer responses put return values under `results[0].returnValues`
        let returnValues = result.returnValues ?? result.results?.[0]?.returnValues;
        if (!returnValues) return null;

        // returnValues is typically an array where the first element contains the actual return
        // e.g. [ [ <bytes array> , "0x1::string::String" ] ] or [ <primitive> ]
        const first = returnValues[0];
        if (first === undefined) return null;

        // If first is an array like [value, type], prefer the value
        const valueCandidate = Array.isArray(first) && first.length > 0 ? first[0] : first;

        // If it's a byte array (array of numbers), try to interpret as either UTF-8 text or numeric (u64)
        if (Array.isArray(valueCandidate) && valueCandidate.every((n: any) => typeof n === 'number')) {
            try {
                const numArr = valueCandidate as number[];
                // Heuristic: BCS-encoded vector<u64> often encodes as [len, <8*len bytes little-endian>]
                if (numArr.length >= 1 && ((numArr.length - 1) % 8) === 0) {
                    const count = numArr[0];
                    if (1 + count * 8 === numArr.length) {
                        const out: string[] = [];
                        for (let i = 0; i < count; i++) {
                            let value = BigInt(0);
                            for (let b = 0; b < 8; b++) {
                                const byte = BigInt(numArr[1 + i * 8 + b]);
                                value |= byte << (BigInt(8) * BigInt(b));
                            }
                            out.push(value.toString());
                        }
                        return out;
                    }
                }

                // If length <= 8 and contains small integers, it could be a little-endian u64
                if (numArr.length > 0 && numArr.length <= 8 && numArr.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
                    // Interpret as little-endian unsigned integer
                        let value = BigInt(0);
                    for (let i = 0; i < numArr.length; i++) {
                        value |= BigInt(numArr[i]) << (BigInt(8) * BigInt(i));
                    }
                    return value.toString();
                }

                // Otherwise decode as UTF-8 text
                const bytes = Uint8Array.from(numArr);
                const decoded = new TextDecoder().decode(bytes);
                // Some responses include a short binary prefix before the actual JSON string
                // (for example: [235,6,...,'{',...]). Find the first JSON token or hex prefix and return from there.
                const possibleStarts = [decoded.indexOf('{'), decoded.indexOf('['), decoded.indexOf('"'), decoded.indexOf('0x')]
                    .filter(i => i >= 0);
                if (possibleStarts.length > 0) {
                    const firstJsonIndex = Math.min(...possibleStarts);
                    if (!isNaN(firstJsonIndex) && firstJsonIndex >= 0) {
                        const trimmed = decoded.substring(firstJsonIndex);
                        return trimmed;
                    }
                }
                return decoded;
            } catch (e) {
                return valueCandidate;
            }
        }

        // Otherwise return as-is (could be string, array, number, object)
        return valueCandidate;
    }
    
    async function getGoalsForDao(daoId: number) {
     if (!client) throw new Error("IOTA client not available");

        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::view_goals_for_dao`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(daoId)],
        });

        const result = await safeDevInspect(tx);

        // Get the event from the devInspect result
        const event = result.events?.find(e => e.type === `${PACKAGE_ID}::dao::GoalsForDaoRetrieved`);
        if (event) {
            const goals = (event.parsedJson as any)?.goals || [];
            return goals.map((g: any) => ({
                goalId: g.id,
                dao_id: g.dao_id,
                ...JSON.parse(g.goal_uri)
            }));
        }
        return [];
    }
    async function getAllDaos(){
        const stateData = await fetchStateData();
        let loadedDaos: any[] = [];
        try {
            if (
                stateData.data?.content &&
                stateData.data.content.dataType === "moveObject"
            ) {
                const fields = (stateData.data.content as any).fields;
                const daosField = fields?.daos || fields?.["daos"];
                if (!daosField) {
                    console.warn("No 'daos' field found on state object fields:", fields);
                } else {
                    const tableId = daosField?.id || (daosField.fields && daosField.fields.id.id);
                    if (!tableId) {
                        console.warn("No table id found in daosField:", daosField);
                        loadedDaos.push(daosField);
                    } else {
                        // Get dynamic fields of the table to access contents
                        const dynamicFields = await client.getDynamicFields({ parentId: tableId });
                        for (const field of dynamicFields.data) {
                            const fieldAny = field as any;
                            if (fieldAny.value && fieldAny.value.fields) {
                                loadedDaos.push({ id: field.name.value || field.name, ...fieldAny.value.fields });
                            } else if (fieldAny.objectId) {
                                const obj = await client.getObject({ id: fieldAny.objectId, options: { showContent: true } });
                                if (obj.data?.content?.dataType === "moveObject" && obj.data.content.fields) {
                                    loadedDaos.push({ id: field.name.value || field.name, ...(obj.data.content.fields as any)?.value.fields });
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching DAOs:", error);
        }
        // store in context state so components using `daos` receive updates
        try {
            setDaos(loadedDaos);
        } catch (e) {
            // setDaos should be available, but guard just in case
            console.warn("Failed to set daos state:", e);
        }
        return loadedDaos;
    }

    async function getGoalUri(id: number) {
        if (!client) return "";
        if (isNaN(id) || id < 0) {
            console.error(`getGoalUri: invalid id=${id}`);
            return "";
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::goal_uri`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            return typeof val === 'string' ? val : String(val ?? "");
        } catch (e) {
            console.error(e);
            return "";
        }
    }
    async function getAllIdeasByGoalId(id: number) {
        if (!client) return [];
        if (isNaN(id) || id < 0) {
            console.error(`getAllIdeasByGoalId: invalid id=${id}`);
            return [];
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_all_ideas_by_goal_id`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await safeDevInspect(tx);

            const val = extractDevInspectValue(result);

            // Helper to decode numeric byte arrays into UTF-8 strings
            const decodeBytes = (arr: any) => {
                try {
                    if (!Array.isArray(arr)) return String(arr);
                    const bytes = Uint8Array.from(arr.map((n: any) => Number(n)));
                    return new TextDecoder().decode(bytes);
                } catch (e) {
                    return String(arr);
                }
            };

            if (Array.isArray(val)) {
                const out: string[] = [];
                for (const el of val) {
                    if (typeof el === 'string') { out.push(el); continue; }
                    if (Array.isArray(el) && el.every((n: any) => typeof n === 'number')) {
                        const decoded = decodeBytes(el);
                        // Try parse JSON array
                        try {
                            const parsed = JSON.parse(decoded);
                            if (Array.isArray(parsed)) {
                                out.push(...parsed.map((p: any) => (typeof p === 'string' ? p : JSON.stringify(p))));
                                continue;
                            }
                        } catch (e) {}
                        out.push(decoded);
                        continue;
                    }
                    out.push(typeof el === 'object' ? JSON.stringify(el) : String(el));
                }
                return out;
            }

            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed.map((el: any) => (typeof el === 'string' ? el : JSON.stringify(el)));
                } catch (e) {
                    return [val];
                }
            }

            return [String(val)];
        } catch (e) {
            console.error('getAllIdeasByGoalId error', e);
            return [];
        }
    }
    async function getIdeasIdByIdeasUri(uri: string) {
        if (!client) return 0;
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_ideas_id_by_ideas_uri`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.string(uri)],
        });
        try {
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            return Number(val ?? 0);
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
    async function getIdeasUri(id: number) {
        if (!client) return "";
        if (isNaN(id) || id < 0) {
            console.error(`getIdeasUri: invalid id=${id}`);
            return "";
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::ideas_uri`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            return typeof val === 'string' ? val : String(val ?? "");
        } catch (e) {
            console.error(e);
            return "";
        }
    }
    async function getUserBadge(wallet: string) {
        if (!client) return null;
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_user_badge`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.string(wallet)],
        });
        try {
            const result = await safeDevInspect(tx,true);
            // Find the UserBadgeRetrieved event and return parsed JSON
            const event = result.events?.find((e: any) => e.type === `${PACKAGE_ID}::dao::UserBadgeRetrieved`);
            if (event) return (event.parsedJson as any) ?? null;
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
    async function getIdeasVotesFromGoal(goalId: number, id: number) {
        if (!client) return [];
        if (isNaN(goalId) || isNaN(id) || goalId < 0 || id < 0) {
            console.error(`getIdeasVotesFromGoal: invalid parameters goalId=${goalId}, id=${id}`);
            return [];
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_ideas_votes_from_goal`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(goalId), tx.pure.u64(id)],
        });

        try {
            const result = await client.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: currentWalletAddress ?? undefined,
            });
            console.log(result);
            const val = extractDevInspectValue(result);

            // Normalizer: ensure we always return an array of strings (voter addresses)
            const decodeBytesToString = (bytes: any[]) => {
                try {
                    const bytesArr = Uint8Array.from(bytes as number[]);
                    return new TextDecoder().decode(bytesArr);
                } catch (e) {
                    return String(bytes);
                }
            };

            const extractAddressesFromString = (s: string): string[] => {
                // Try JSON first
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) return parsed.map((x: any) => String(x));
                } catch (e) {}
                // Fallback: extract hex-like addresses (0x...) which are common
                const re = /0x[a-fA-F0-9]+/g;
                const matches = s.match(re);
                if (matches && matches.length > 0) return matches.map(m => m.trim());
                // Some payloads include a leading non-json prefix (e.g. binary length) then plain addresses
                // Fallback to splitting on whitespace/comma
                const parts = s.split(/[\s,;|]+/).map(p => p.trim()).filter(Boolean);
                return parts;
            };

            const normalize = (input: any): string[] => {
                if (!input && input !== 0) return [];
                // If it's already an array
                if (Array.isArray(input)) {
                    const out: string[] = [];
                    for (const el of input) {
                        if (typeof el === 'string') {
                            out.push(el);
                            continue;
                        }
                        if (Array.isArray(el) && el.every((n: any) => typeof n === 'number')) {
                            const decoded = decodeBytesToString(el);
                            const extracted = extractAddressesFromString(decoded);
                            out.push(...extracted);
                            continue;
                        }
                        if (Array.isArray(el)) {
                            // nested arrays: recurse
                            out.push(...normalize(el));
                            continue;
                        }
                        // other primitives
                        out.push(String(el));
                    }
                    return out;
                }

                if (typeof input === 'string') {
                    // If the string looks like a JSON array
                    try {
                        const parsed = JSON.parse(input);
                        if (Array.isArray(parsed)) return parsed.map((x: any) => String(x));
                    } catch (e) {}

                    // Try to extract addresses from string content
                    const extracted = extractAddressesFromString(input);
                    if (extracted.length > 0) return extracted;

                    // maybe it is a single address-like string
                    if (input.trim().length > 0) return [input.trim()];
                    return [];
                }

                // If it's a byte-array-like encoded inside an object, try to find numeric arrays
                if (typeof input === 'object') {
                    // try to traverse typical devInspect shapes
                    // e.g. [[bytes], "type"] or { value: [bytes] }
                    if ('value' in input) return normalize((input as any).value);
                    const maybeArray = (input as any)[0];
                    if (maybeArray) return normalize(maybeArray);
                }

                // Fallback: stringify
                return [String(input)];
            };

            // Sometimes the SDK nests the returned bytes inside multiple single-element arrays
            const deepUnwrap = (v: any): any => {
                try {
                    // If it's an array with a single element, unwrap repeatedly
                    if (Array.isArray(v) && v.length === 1) return deepUnwrap(v[0]);
                    return v;
                } catch (e) {
                    return v;
                }
            };

            const candidate = deepUnwrap(val);
            const normalized = normalize(candidate);
            // Remove duplicates and empty strings
            const cleaned = Array.from(new Set(normalized.map(s => String(s).trim()).filter(Boolean)));
            if (cleaned[0] === "0") cleaned.shift(); // remove lone "0x" entries if present
            if (cleaned.length === 0 && val) {
                console.warn("getIdeasVotesFromGoal: normalization produced empty array; raw val:", val);
            }
            
            return cleaned;
        } catch (e) {
            console.error(e);
            return [];
        }
    }
    async function getIdeasDonation(id: number) {
        if (!client) return 0;
        if (isNaN(id) || id < 0) {
            console.error(`getIdeasDonation: invalid id=${id}`);
            return 0;
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_ideas_donation`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await client.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: currentWalletAddress ?? undefined,
            });
            const val = extractDevInspectValue(result);
            return ParseBigNumber(Number(val ?? 0));
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
    async function getMsgIDs(id: number) {
        if (!client) return [];
        if (isNaN(id) || id < 0) {
            console.error(`getMsgIDs: invalid id=${id}`);
            return [];
        }

        // Try to read messages table dynamic fields and filter by ideas_id
        try {
            const stateData = await fetchStateData();
            const content = stateData?.data?.content;
            const fields = content?.fields ?? stateData ?? {};
            const messagesField = fields?.messages ?? fields?.messages;
            const tableId = messagesField?.fields?.id?.id || messagesField?.id;
            if (tableId) {
                const dynamicFields = await client.getDynamicFields({ parentId: tableId });
                const outIds: number[] = [];
                for (const df of dynamicFields.data) {
                    try {
                        const obj = await client.getObject({ id: df.objectId || df.objectId || df.objectId, options: { showContent: true } });
                        const objFields = obj?.data?.content?.fields ?? obj?.content?.fields ?? {};
                        // message object may store the ideas_id under different keys; attempt common names
                        const ideasIdRaw = objFields?.ideas_id ?? objFields?.dao_id ?? objFields?.id ?? objFields?.ideasId ?? objFields?.ideas_id?.value;
                        const msgIdRaw = df?.name ?? df?.objectId ?? obj?.data?.objectId ?? obj?.objectId;
                        // try to infer numeric id from df.name or parsed fields
                        const maybeId = Number(df?.name ?? obj?.data?.content?.id ?? obj?.data?.objectId ?? NaN);
                        if (ideasIdRaw !== undefined && Number(ideasIdRaw) === Number(id)) {
                            if (!Number.isNaN(maybeId)) outIds.push(Number(maybeId));
                            else {
                                // attempt to parse object content id field
                                const parsedId = Number(objFields?.id ?? objFields?.message_id ?? NaN);
                                if (!Number.isNaN(parsedId)) outIds.push(parsedId);
                            }
                        }
                    } catch (e) {
                        // skip problematic entries
                        continue;
                    }
                }
                return outIds;
            }
        } catch (e) {
            console.warn('getMsgIDs (dynamicFields) failed, falling back to devInspect', e);
        }

        // Fallback to devInspect-based call
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE}::getMsgIDs`,
                arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
            });
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            if (Array.isArray(val)) return val.map((x: any) => Number(x));
            if (typeof val === 'string') {
                try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed.map((x: any) => Number(x)); } catch (e) {}
            }
            return [];
        } catch (e) {
            console.error('getMsgIDs fallback error', e);
            return [];
        }
    }
    async function getAllMessages(id: number) {
        if (!client) return "{}";
        if (isNaN(id) || id < 0) {
            console.error(`getAllMessages: invalid id=${id}`);
            return "{}";
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::all_messages`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await safeDevInspect(tx);

            // Prefer event payload if Move emitted a MessageRetrieved event
            const event = result.events?.find((e: any) => e.type === `${PACKAGE_ID}::dao::MessageRetrieved`);
            if (event) {
                try {
                    const parsed = (event.parsedJson as any) ?? {};
                    return JSON.stringify({ sender: parsed.sender ?? parsed.dao_wallet ?? "",ideas_id:parsed.ideas_id??0, message: parsed.message ?? "", id: parsed.id ?? id, address: parsed.sender ?? parsed.dao_wallet ?? "" });
                } catch (e) {
                    return JSON.stringify({ rawEvent: event });
                }
            }

            const val = extractDevInspectValue(result);
            if (!val && val !== 0) return "{}";
            if (typeof val === 'string') {
                try { JSON.parse(val); return val; } catch (e) { return JSON.stringify({ raw: val }); }
            }
            try { return JSON.stringify(val); } catch (e) { return JSON.stringify({ raw: String(val) }); }
        } catch (e) {
            console.error(e);
            return "{}";
        }
    }
    async function getReplyIDs(id: number) {
        if (!client) return [];
        if (isNaN(id) || id < 0) {
            console.error(`getReplyIDs: invalid id=${id}`);
            return [];
        }

        // Try dynamic fields on replies table
        try {
            const stateData = await fetchStateData();
            const content = stateData?.data?.content;
            const fields = content?.fields ?? stateData ?? {};
            const repliesField = fields?.replies ?? fields?.replies;
            const tableId = repliesField?.fields?.id?.id || repliesField?.id;
            if (tableId) {
                const dynamicFields = await client.getDynamicFields({ parentId: tableId });
                const outIds: number[] = [];
                for (const df of dynamicFields.data) {
                    try {
                        const obj = await client.getObject({ id: df.objectId || df.objectId || df.objectId, options: { showContent: true } });
                        const objFields = obj?.data?.content?.fields ?? obj?.content?.fields ?? {};
                        const ideasIdRaw = objFields?.ideas_id ?? objFields?.dao_id ?? objFields?.id ?? objFields?.ideasId ?? objFields?.ideas_id?.value;
                        const maybeId = Number(df?.name ?? obj?.data?.content?.id ?? NaN);
                        if (ideasIdRaw !== undefined && Number(ideasIdRaw) === Number(id)) {
                            if (!Number.isNaN(maybeId)) outIds.push(Number(maybeId));
                            else {
                                const parsedId = Number(objFields?.id ?? objFields?.reply_id ?? NaN);
                                if (!Number.isNaN(parsedId)) outIds.push(parsedId);
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
                return outIds;
            }
        } catch (e) {
            console.warn('getReplyIDs (dynamicFields) failed, falling back to devInspect', e);
        }

        // Fallback to devInspect-based call
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE}::getReplyIDs`,
                arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
            });
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            if (Array.isArray(val)) return val.map((x: any) => Number(x));
            if (typeof val === 'string') {
                try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed.map((x: any) => Number(x)); } catch (e) {}
            }
            return [];
        } catch (e) {
            console.error('getReplyIDs fallback error', e);
            return [];
        }
    }
    async function getAllReplies(id: number) {
        if (!client) return "{}";
        if (isNaN(id) || id < 0) {
            console.error(`getAllReplies: invalid id=${id}`);
            return "{}";
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::all_replies`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.u64(id)],
        });
        try {
            const result = await safeDevInspect(tx);

            // Prefer event payload if Move emitted a ReplyRetrieved event
            const event = result.events?.find((e: any) => e.type === `${PACKAGE_ID}::dao::ReplyRetrieved`);
            if (event) {
                try {
                    const parsed = (event.parsedJson as any) ?? {};
                    return JSON.stringify({ message: parsed.message ?? "", ideas_id: parsed.ideas_id ?? parsed.dao_id ?? 0, id: parsed.id ?? id });
                } catch (e) {
                    return JSON.stringify({ rawEvent: event });
                }
            }

            const val = extractDevInspectValue(result);
            if (!val && val !== 0) return "{}";
            if (typeof val === 'string') {
                try { JSON.parse(val); return val; } catch (e) { return JSON.stringify({ raw: val }); }
            }
            try { return JSON.stringify(val); } catch (e) { return JSON.stringify({ raw: String(val) }); }
        } catch (e) {
            console.error(e);
            return "{}";
        }
    }

    async function getGoalIdFromIdeasUri(uri: string) {
        if (!client) return 0;
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE}::get_goal_id_from_ideas_uri`,
            arguments: [tx.object(STATE_OBJECT), tx.pure.string(uri)],
        });
        try {
            const result = await safeDevInspect(tx);
            const val = extractDevInspectValue(result);
            return Number(val ?? 0);
        } catch (e) {
            console.error(e);
            return 0;
        }
    }
    async function getMessageIds() {
        // Read message counter from cached state for performance and reliability.
        try {
            const stateData = await fetchStateData();
            const content = stateData?.data?.content;
            const fields = content?.fields ?? stateData ?? {};

            // Try multiple locations where the counter may be stored.
            const rawCounter = fields?.message_counter ?? fields?.message_counter?.value ?? fields?.messages?.fields?.size ?? fields?.messages?.size;
            const counter = Number(rawCounter ?? 0);
            return Number.isNaN(counter) ? 0 : counter;
        } catch (e) {
            console.error('getMessageIds (fetchStateData) error', e);
            return 0;
        }
    }
    async function getReplyIds() {
        // Read reply counter from cached state instead of devInspect.
        try {
            const stateData = await fetchStateData();
            const content = stateData?.data?.content;
            const fields = content?.fields ?? stateData ?? {};

            const rawCounter = fields?.reply_counter ?? fields?.reply_counter?.value ?? fields?.replies?.fields?.size ?? fields?.replies?.size;
            const counter = Number(rawCounter ?? 0);
            return Number.isNaN(counter) ? 0 : counter;
        } catch (e) {
            console.error('getReplyIds (fetchStateData) error', e);
            return 0;
        }
    }

    async function fetchInfo() {

        if (window.localStorage.getItem("login-type") === "iota") {
            const wallet = wallets[0];
            if (wallet) {


                const result = await connect.mutateAsync({
                    wallet,
                    silent: true,
                });

                const accounts = result?.accounts ?? [];
                if (accounts && accounts.length > 0) {
                    const acct0: any = accounts[0];
                    const addr = acct0?.address ?? acct0?.bech32Address ?? JSON.stringify(acct0);
                    setCurrentWalletAddress(addr.toString());
                    refetch();
                    running = false;
                getAllDaos();

                }

            }
        }
    }
    return <IOTAContext.Provider value={{ getAllDaos,getGoalsForDao, ParseBigNumber, WrapBigNumber, Balance, currentWalletAddress, sendTransaction, sendNative, daos, queryEvent, sleep, contract: client, getGoalUri, getAllIdeasByGoalId, getIdeasIdByIdeasUri, getIdeasUri, getGoalIdFromIdeasUri, getIdeasVotesFromGoal, getIdeasDonation, getMsgIDs, getAllMessages, getReplyIDs, getAllReplies, getMessageIds, getReplyIds, getUserBadge }}>
        {children}
    </IOTAContext.Provider>
};

