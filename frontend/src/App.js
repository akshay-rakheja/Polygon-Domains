import React, { useEffect, useState } from "react";import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import CONTRACT_ABI from './utils/Domains.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// Add the domain you will be minting
const tld = '.united';
const CONTRACT_ADDRESS = '0xbe61F2bA0d7E18187085914C5E59d2519A983636';


const App = () => {

	const[currentAccount, setAccount] = useState("");
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');


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

				console.log("Going to pop wallet now to pay gas...")
				let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
				// Wait for the transaction to be mined
				const receipt = await tx.wait();

				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
							
					// Set the record for the domain
					tx = await contract.setRecord(domain, record);
					await tx.wait();

					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
					
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
					placeholder='Enter a record you wanna save.'
					onChange={e => setRecord(e.target.value)}
				/>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={null} onClick={mintDomain}>
						Mint
					</button>  
					<button className='cta-button mint-button' disabled={null} onClick={null}>
						Set data
					</button>  
				</div>

			</div>
		);
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
					</header>
				</div>
				{/*if account isnt connected render this */}
				{!currentAccount && renderNotConnectedContainer()}
				
				{/* Render this if the account is connected*/}
				{currentAccount && renderInputForm()}

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
