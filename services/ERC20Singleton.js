
import { ethers } from 'ethers';

import erc20 from '../contracts/deployments/hedera/GreenDAO.json';

export default async function ERC20Singleton() {


	const providerURL = 'https://testnet.hashio.io/api';
	// Define provider
	const provider = new ethers.providers.JsonRpcProvider(providerURL, {
		chainId: 296,
		name: 'hedera-testnet'
	});
	let signer = provider;
	if (Number(window?.ethereum?.networkVersion) === Number(296)) {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		signer = provider.getSigner();
	}
	const contract = new ethers.Contract(erc20.address, erc20.abi, signer)

	return contract
}
