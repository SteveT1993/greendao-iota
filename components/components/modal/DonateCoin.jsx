import React, { useState, useEffect } from "react";
import Dialog, { DialogProps } from "@mui/material/Dialog";

import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { Transaction } from "@iota/iota-sdk/transactions";
import FormControl, { useFormControl } from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import LoadingButton from "@mui/lab/LoadingButton";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { useIOTA } from "../../../contexts/IOTAContext";


export default function DonateCoin({ ideasid, show, onHide, address }) {

	const [CurrentAddress, setCurrentAddress] = useState("");
	const [Coin, setCoin] = useState("IOTA");
	const [isLoading, setisLoading] = useState(false);
	const [isSent, setisSent] = useState(false);
	const { sendTransaction, sendNative, currentWalletAddress, Balance: IotaBalance, WrapBigNumber } = useIOTA();
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

		try {
			ShowAlert("pending", "Transferring " + amount.value + " IOTA .....");

			const amt = Number(amount.value);
			if (!(amt > 0)) throw new Error('Invalid amount');
			const result = await sendNative(address, amt);
			let link = "";
			try { link = result?.digest ?? result?.transactionBlock?.digest ?? result?.txDigest ?? JSON.stringify(result); } catch (e) { link = String(result); }
			setTransaction({ link });
			ShowAlert("success", "Transfer Successful: " + (link ? link : ""));


			ShowAlert("pending", "Saving Information .....");
			// default: call Move function to record donation on-chain
			const tx = new Transaction();
			const amountBase = tx.pure.u64(WrapBigNumber(Number(amount.value)));
			const result2 = await sendTransaction(tx, "add_donation", [tx.pure.u64(Number(ideasid)), amountBase, tx.pure.string(CurrentAddress || currentWalletAddress || "")]);
			let link2 = "";
			try { link2 = result2?.digest ?? result2?.transactionBlock?.digest ?? result2?.txDigest ?? JSON.stringify(result2); } catch (e) { link2 = String(result2); }
			setTransaction({ link2 });
			ShowAlert("success", "Donate Successful: " + (link2 ? link2 : ""));
			LoadData();
			setisLoading(false);
			setisSent(true);

		} catch (err) {
			console.error(err);
			ShowAlert("error", "Transaction failed: " + (err?.message || err));
			setisLoading(false);
		}
	}
	const StyledPaper = styled(Paper)(({ theme }) => ({
		backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
		...theme.typography.body2,
		padding: theme.spacing(2),
		color: theme.palette.text.primary
	}));
	async function LoadData() {
		// Use IOTA context balance and wallet address
		const token = " " + Coin;
		if (IotaBalance) setBalance(IotaBalance + token);
		else setBalance("Loading...");
		setCurrentAddress((currentWalletAddress || "").toString());
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
							<div variant="standard" style={{ wordBreak: 'break-all' }}>
								<InputLabel>Target Address</InputLabel>
								<span>{address}</span>
							</div>
						</StyledPaper>

						<StyledPaper sx={{ my: 1, mx: "auto", p: 2 }}>
							<div variant="standard" style={{ wordBreak: 'break-all' }}>
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
