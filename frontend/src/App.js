import React, { useEffect, useState } from "react";import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import CONTRACT_ABI from './utils/Domains.json';
import { networks } from "./utils/networks";
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// Add the domain you will be minting
const tld = '.united';
const CONTRACT_ADDRESS = '0x1ab8b7821Ad44e8cB1D570901E44c017be5Cdb98';


const App = () => {

	const [network, setNetwork] = useState('');
	const[currentAccount, setAccount] = useState("");
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	const [editing, setEditing] = useState(false);
	const [loading,setLoading] = useState(false);
	const [mints, setMints] = useState([]);


	const connectWallet = async() => {

		try{
			const{ethereum} = window;
			if(!ethereum){
				console.log("Install Metamask");
				return;
			}
			// Fancy method to request access to account.
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			// This should print out public address once we authorize Metamask.
			console.log("Connected", accounts[0]);
			setAccount(accounts[0]);
		}
		catch(error){
			console.log(error);
		}

	}
	const checkWalletConnection = async () => {
		const {ethereum} = window;

		if(ethereum){
			console.log("We have ethereum object!");
		}
		else{
			console.log("Install Metamask!");
		}

		const accounts = await ethereum.request({method: "eth_accounts"});
		
		// Users can have multiple authorized accounts, we grab the first one if its there!
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setAccount(account);
		} else {
			console.log('No authorized account found');
		}

		// This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
		console.log("network is :", network);

		ethereum.on('chainChanged', handleChainChanged);
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}

	}

	const switchNetwork = async () => {
	if (window.ethereum) {
		try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
		} catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
				try {
					await window.ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [
							{	
								chainId: '0x13881',
								chainName: 'Polygon Mumbai Testnet',
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18
								},
								blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
							},
						],
					});
				} catch (error) {
					console.log(error);
				}
			}
			console.log(error);
		}
	} else {
		// If window.ethereum is not found then MetaMask is not installed
		alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
	} 
	}


	const mintDomain = async() => {

		if (!domain){return}
		if (domain.length <3 ){
			alert("Domain needs to be atleast 3 characters long.");
			return;
		}
		//calculating price
		const price = domain.length === 3 ? '1' : domain.length === 4 ? '0.5' : '0.2';
		console.log("Minting domain", domain, "with price", price);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);
				console.log(contract);
				console.log("Going to pop wallet now to pay gas...");
				let tx1 = await contract.register(domain, {value: ethers.utils.parseEther(price)});
				// Wait for the transaction to be mined
				console.log("gonna wait for txn.");
				const receipt = await tx1.wait();
				console.log("reached here");

				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx1.hash);
							
					// Set the record for the domain
					let tx2 = await contract.setRecord(domain, record);
					await tx2.wait();

					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx2.hash);
					
					setRecord('');
					setDomain('');
				}
				else {
					alert("Transaction failed! Please try again");
				}
			}
		}
		catch(error){
			console.log(error);
			}
		}
	
	const fetchMints = async () => {
	try {
		const { ethereum } = window;
		if (ethereum) {
			// You know all this
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);
				
			// Get all the domain names from our contract
			const names = await contract.getAllNames();
				
			// For each name, get the record and the address
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.records(name);
			const owner = await contract.domains(name);
			return {
				id: names.indexOf(name),
				name: name,
				record: mintRecord,
				owner: owner,
			};
		}));

			console.log("MINTS FETCHED ", mintRecords);
			setMints(mintRecords);
			}
		} catch(error){
			console.log(error);
		}
	}

// This will run any time currentAccount or network are changed
useEffect(() => {
	if (network === 'Polygon Mumbai Testnet') {
		fetchMints();
	}
}, [currentAccount, network]);

		const updateDomain = async () => {
			if (!record || !domain) { return }
			setLoading(true);
			console.log("Updating domain", domain, "with record", record);
			try {
				const { ethereum } = window;
				if (ethereum) {
					const provider = new ethers.providers.Web3Provider(ethereum);
					const signer = provider.getSigner();
					const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

					let tx = await contract.setRecord(domain, record);
					await tx.wait();
					console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

					// Call fetchMints after 2 seconds
					setTimeout(() => {
						fetchMints();
					}, 2000);

					setRecord('');
					setDomain('');
				}
			} catch(error) {
				console.log(error);
			}
			setLoading(false);
		}

		// Create a function to render if wallet is not connected yet
		const renderNotConnectedContainer = () => (
			<div className="connect-wallet-container">
				<img src="https://media.giphy.com/media/Irkk1Cnwa0NywortlM/giphy.gif" alt="United gif" />
				<button onClick={connectWallet} className="cta-button connect-wallet-button">
					Connect Wallet
				</button>
			</div>
  		);

	// Form to enter domain name and data
	const renderInputForm = () =>{
		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<p>Please connect to Polygon Mumbai Testnet</p>
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}

		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='whats ur ninja power?'
					onChange={e => setRecord(e.target.value)}
				/>
					{/* If the editing variable is true, return the "Set record" and "Cancel" button */}
					{editing ? (
						<div className="button-container">
							<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
								Update record
							</button>  
							<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
								Cancel
							</button>  
						</div>
					) : (
						// If editing is not true, the mint button will be returned instead
						<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
							Mint
						</button>  
					)}
			</div>
		);
	}
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle"> Recently minted domains!</p>
					<div className="mint-list">
						{ mints.map((mint, index) => {
							return (
								<div className="mint-item" key={index}>
									<div className='mint-row'>
										<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
											<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
										</a>
										{/* If mint.owner is currentAccount, add an "edit" button*/}
										{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
											<button className="edit-button" onClick={() => editRecord(mint.name)}>
												<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
											</button>
											:
											null
										}
									</div>
						<p> {mint.record} </p>
					</div>)
					})}
				</div>
			</div>);
		}
	};

// This will take us into edit mode and show us the edit buttons!
const editRecord = (name) => {
	console.log("Editing record for", name);
	setEditing(true);
	setDomain(name);
}

	// This runs our function when the page loads.
	useEffect(() => {
		checkWalletConnection();
	}, [])

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
				<header>
					<div className="left">
						<p className="title">🐱‍👤 United Name Service</p>
						<p className="subtitle">Your immortal API on the blockchain!</p>
					</div>
					{/* Display a logo and wallet connection status*/}
					<div className="right">
						<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
						{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
					</div>
				</header>
				</div>
				{/*if account isnt connected render this */}
				{!currentAccount && renderNotConnectedContainer()}
				
				{/* Render this if the account is connected*/}
				{currentAccount && renderInputForm()}

				{mints && renderMints()}

        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
