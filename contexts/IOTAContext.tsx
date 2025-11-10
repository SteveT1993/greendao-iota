import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallets, useSignAndExecuteTransaction, useConnectWallet, useCurrentAccount, useIotaClient, useIotaClientQuery } from "@iota/dapp-kit";

import { Transaction, } from "@iota/iota-sdk/transactions";
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
    daos: [],
    getAllDaos: async () => []
});

export const useIOTA = () => useContext(IOTAContext);

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
    async function fetchStateData(){
        if (!client) throw new Error("IOTA dapp-kit client not found");

        const stateData = await client.getObject({
            id: STATE_OBJECT,
            options: { showContent: true },
        });
        return stateData;
    }
    async function getAllDaos(){
        const stateData = await fetchStateData();
        console.log("stateData:", stateData);
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
                        console.log("dynamicFields:", dynamicFields);
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
            } else {
                console.warn('State object missing or not a moveObject', stateData);
            }
        } catch (e) {
            console.error('Error parsing daos from state object', e, stateData);
        }
        setDaos(loadedDaos);
        console.log('loadedDaos:', loadedDaos);
        return loadedDaos;
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

    return <IOTAContext.Provider value={{ getAllDaos, ParseBigNumber, WrapBigNumber, Balance, currentWalletAddress, sendTransaction, daos }}>
        {children}
    </IOTAContext.Provider>
};
