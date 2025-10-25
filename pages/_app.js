
import "../public/theme.css";
import "../public/output.css";
import "../public/css/ideas.css";
import "../public/css/daos.css";
import { ThemeProvider } from 'next-themes'
import { SnackbarProvider } from "notistack";
import { IPFSProvider } from "../contexts/IPFSContext";
import React, { useState, useEffect } from "react";
import { IOTAProvider } from "../contexts/IOTAContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNetworkConfig, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';


const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);
	const { networkConfig } = createNetworkConfig({
		localnet: { url: getFullnodeUrl('localnet') },
		testnet: { url: getFullnodeUrl('testnet') },
	});
	return (<>		{isClient ? (
		<QueryClientProvider client={queryClient}>
			<SnackbarProvider anchorOrigin={{ vertical: "top", horizontal: "right" }} maxSnack={5} autoHideDuration={3000} >
				<IPFSProvider>
					<ThemeProvider defaultTheme={"dark"} enableColorScheme={false} attribute="class" enableSystem={false}>
						<IotaClientProvider networks={networkConfig} defaultNetwork="testnet">
							<WalletProvider>
							<IOTAProvider>
								<Component {...pageProps} />
							</IOTAProvider>
							</WalletProvider>
						</IotaClientProvider>
					</ThemeProvider>
				</IPFSProvider>
			</SnackbarProvider>
		</QueryClientProvider>) : <></>}</>

	);
}


export default MyApp;
