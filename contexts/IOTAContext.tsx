import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallets, useConnectWallet, useCurrentAccount, useDisconnectWallet, useIotaClientQuery } from "@iota/dapp-kit";


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
    Balance:"",
    currentWalletAddress:""
});

export const useIOTA = () => useContext(IOTAContext);

let running = false;

export const IOTAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [Balance, setBalance] = useState("");

    // dApp Kit hooks (safe: this component is client-only)
    const wallets = useWallets();
    const currentAccount = useCurrentAccount();
    const connect = useConnectWallet();
    const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);

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
                }

            }
        }
    }

    return <IOTAContext.Provider value={{ ParseBigNumber, WrapBigNumber, Balance, currentWalletAddress }}>
        {children}
    </IOTAContext.Provider>
};
