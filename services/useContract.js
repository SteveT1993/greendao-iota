import { useState, useEffect } from "react";
// import { ethers } from 'ethers';
// import Web3 from 'web3';
// import ERC20Singleton from './ERC20Singleton';
// import HDWalletProvider from '@truffle/hdwallet-provider'
// import GreenDAO from '../contracts/deployments/hedera/GreenDAO.json';


export default function useContract() {
	const [contractInstance, setContractInstance] = useState({
		contract: null,
		signerAddress: null,
		sendTransaction: sendTransaction,
		formatTemplate:formatTemplate,
		saveReadMessage:saveReadMessage
	})

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (window.localStorage.getItem("login-type") === "iota") {
					// Example: Connect to IOTA Wallet (Firefly, wallet.rs, etc.)
					// Replace with actual IOTA wallet connect logic
					if (window.iota) {
						const accounts = await window.iota.request({ method: "iota_connect" });
						const contract = { contract: null, signerAddress: null, sendTransaction: sendTransaction, formatTemplate: formatTemplate, saveReadMessage: saveReadMessage };
						contract.signerAddress = accounts[0]; // IOTA address
						setContractInstance(contract);
						window.signer = accounts[0];
						window.contract = null; // Replace with IOTA contract instance if needed
						window.sendTransaction = sendTransaction;
					}
				}
			} catch (error) {
				console.error(error)
			}
		}
		fetchData()
	}, [])


	async function sendTransaction(methodWithSignature) {
		// Replace with IOTA transaction logic
		if (window.iota && window.signer) {
			try {
				// Example: send transaction using IOTA wallet
				await window.iota.request({ method: "iota_sendTransaction", params: methodWithSignature });
			} catch (error) {
				console.error(error);
			}
		}
		return;
	}



	return contractInstance
}




export function formatTemplate(template,changings){
	


	for (let i = 0; i < changings.length; i++) {
		const element = changings[i];
		template =template.replaceAll("{{"+element.key+"}}",element.value);		
	}
	return template;

}


export async function saveReadMessage(messageid,ideasid,msg_type) {
	

}