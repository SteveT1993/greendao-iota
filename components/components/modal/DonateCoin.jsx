import React, { useState, useEffect } from "react";
import Dialog, { DialogProps } from "@mui/material/Dialog";

import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { ethers } from "ethers";
import FormControl, { useFormControl } from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import LoadingButton from "@mui/lab/LoadingButton";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import useContract from "../../../services/useContract";


export default function DonateCoin({ ideasid, show, onHide, address }) {

	const [CurrentAddress, setCurrentAddress] = useState("");
	const [Coin, setCoin] = useState("IOTA");
	const [isLoading, setisLoading] = useState(false);
	const [isSent, setisSent] = useState(false);
	const { sendTransaction } = useContract()
	let alertBox = null;
	const [transaction, setTransaction] = useState({
		link: "",
		token: ""
	});
	const [Balance, setBalance] = useState("");
	function ShowAlert(type = "default", message) {
		const pendingAlert = alertBox.children["pendingAlert"];
		const successAlert = alertBox.children["successAlert"];
		const errorAlert = alertBox.children["errorAlert"];

		alertBox.style.display = "block";
		pendingAlert.style.display = "none";
		successAlert.style.display = "none";
		errorAlert.style.display = "none";
		switch (type) {
			case "pending":
				pendingAlert.querySelector(".MuiAlert-message").innerText = message;
				pendingAlert.style.display = "flex";
				break;
			case "success":
				successAlert.querySelector(".MuiAlert-message").innerText = message;
				successAlert.style.display = "flex";
				break;
			case "error":
				errorAlert.querySelector(".MuiAlert-message").innerText = message;
				errorAlert.style.display = "flex";
				break;
		}
	}

	async function DonateCoinSubmission(e) {
		e.preventDefault();
		console.clear();
		setisSent(false);
		const { amount } = e.target;
		alertBox = e.target.querySelector("[name=alertbox]");
		setisLoading(true);
		ShowAlert("pending","Transferring " + amount.value + " IOTA .....");

		const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
		//If it is sending from hedera then it will not use bridge
		const tx = {
			from: window?.ethereum?.selectedAddress?.toLocaleLowerCase(),
			to: address,
			value: ethers.utils.parseEther(amount.value)
		};
		const reciept = await (await signer.sendTransaction(tx)).wait();


		setTransaction({
			link: reciept.transaction
		});
		ShowAlert("pending","Saving Information.....");

		// Saving Donation count on smart contract
		await sendTransaction(await window.contract.populateTransaction.add_donation(Number(ideasid), ethers.utils.parseUnits(amount.value, 'gwei'), CurrentAddress));

		ShowAlert("success","Donate Successful");


		LoadData();
		setisLoading(false);
		setisSent(true);
	}
	const StyledPaper = styled(Paper)(({ theme }) => ({
		backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
		...theme.typography.body2,
		padding: theme.spacing(2),
		color: theme.palette.text.primary
	}));
	async function LoadData() {
		const Web3 = require("web3");
		const web3 = new Web3(window.ethereum);
		let Balance = await web3.eth.getBalance(window?.ethereum?.selectedAddress);
		let token = " " + Coin;


		setBalance((Balance / 1000000000000000000).toFixed(5) + token);
		setCurrentAddress(window?.ethereum?.selectedAddress?.toLocaleLowerCase());
	}
	useEffect(() => {
		LoadData();
	}, [show, Coin]);

	return (
		<Dialog open={show} onClose={onHide} fullWidth="true" aria-labelledby="contained-modal-title-vcenter" centered="true">
			<DialogTitle>Donate Coin</DialogTitle>
			<DialogContent>
				<Container>
					<form id="doanteForm" onSubmit={DonateCoinSubmission} autoComplete="off">
						<div name="alertbox" hidden="true">
							<Alert variant="filled" sx={{ my: 1 }} name="pendingAlert" severity="info">
								Pending....
							</Alert>
							<Alert variant="filled" sx={{ my: 1 }} name="successAlert" severity="success">
								Success....
							</Alert>
							<Alert variant="filled" sx={{ my: 1 }} name="errorAlert" severity="error">
								Error....
							</Alert>
						</div>
						{isSent ? (
							<>

								<StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
									<div variant="standard" className="overflow-hidden">
										<InputLabel sx={{ color: "black" }}>Transaction</InputLabel>
										<a href={transaction.link} className="text-[#0000ff]" rel="noreferrer" target="_blank">
											{transaction.link}
										</a>
									</div>
								</StyledPaper>
							</>
						) : (
							<></>
						)}


						<StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
							<div variant="standard">
								<InputLabel>Target Address</InputLabel>
								<span>{address}</span>
							</div>
						</StyledPaper>

						<StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
							<div variant="standard">
								<InputLabel>From Address</InputLabel>
								<span>{CurrentAddress} (Your)</span>
							</div>
						</StyledPaper>
						<StyledPaper sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", my: 1, mx: "auto", p: 2 }}>
							<FormControl variant="standard">
								<InputLabel>Amount</InputLabel>
								<Input name="amount" />
							</FormControl>
							<div>
								<InputLabel>Balance</InputLabel>
								<p>{Balance}</p>
							</div>
						</StyledPaper>

						<DialogActions>
							<LoadingButton type="submit" name="DonateBTN" loading={isLoading} className="btn-secondary" size="medium">
								Donate
							</LoadingButton>
						</DialogActions>
					</form>
				</Container>
			</DialogContent>
		</Dialog>
	);
}
