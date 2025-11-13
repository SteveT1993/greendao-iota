import React, { useEffect, useState } from "react"
import Head from "next/head"
import UseFormInput from "../../components/components/UseFormInput"
import UseFormTextArea from "../../components/components/UseFormTextArea"
import { Header } from "../../components/layout/Header"
import NavLink from "next/link"

import isServer from "../../components/isServer"
import { useIPFSContext } from '../../contexts/IPFSContext';
import styles from "./CreateIdeas.module.css"
import { Button } from "@heathmont/moon-core-tw"
import { GenericPicture, ControlsPlus } from "@heathmont/moon-icons-tw"
import Loader from '../../components/Loader/Loader'
import { Transaction } from "@iota/iota-sdk/transactions";
import { useIOTA } from '../../contexts/IOTAContext'
export default function CreateIdeas() {
	const [IdeasImage, setIdeasImage] = useState([])
	const [loading, setLoading] = useState(false);
	const { sendTransaction, currentWalletAddress, sleep } = useIOTA()
	
	const {UploadBlob} = useIPFSContext(); 
	if (isServer()) return null;


	//Input fields
	const [IdeasTitle, IdeasTitleInput] = UseFormInput({
		defaultValue: "",
		type: "text",
		placeholder: "Ideas name",
		id: ""
	})
	const [IdeasDescription, IdeasDescriptionInput] = UseFormTextArea({
		defaultValue: "",
		placeholder: "Ideas Description",
		id: "",
		rows: 4
	})

	const [Qoutation1, Qoutation1Input] = UseFormInput({
		defaultValue: "",
		type: "text",
		placeholder: "Give link to quotation ",
		id: "qoutation1"
	})
	const [Qoutation2, Qoutation2Input] = UseFormInput({
		defaultValue: "",
		type: "text",
		placeholder: "Give total prize of the quatation",
		id: "qoutation2"
	})

	let StructureLeft = {
		0: "Representatives Berlin",
		1: "Community",
		2: "Children"
	}
	let StructureRight = {
		0: "20%",
		1: "70%",
		2: "10%"
	}

	let id = -1
	async function createIdeas() {
		setLoading(true);
		var CreateIdeasBTN = document.getElementById("CreateIdeasBTN")
		CreateIdeasBTN.disabled = true
		let allFiles = []
		for (let index = 0; index < IdeasImage.length; index++) {
			//Gathering all files link
			const element = IdeasImage[index]
			const url = element.type ? await UploadBlob(element) : '';
			const image = {
			  url,
			  type: element.type
			};
			allFiles.push(image)
		}

		var smart_contracts = [JSON.stringify({
			link: Qoutation1,
			prize: Qoutation2
		})];

		//Creating an object of all information to store in EVM
		const createdObject = {
			title: "Asset Metadata",
			type: "object",
			properties: {
				Title: {
					type: "string",
					description: IdeasTitle
				},
				Description: {
					type: "string",
					description: IdeasDescription
				},
				StructureLeft: {
					type: "string",
					description: Object.values(StructureLeft)
				},
				StructureRight: {
					type: "string",
					description: Object.values(StructureRight)
				},
				Qoutation: {
					link: Qoutation1,
					prize: Qoutation2
				},
				wallet: {
					type: "string",
					description: currentWalletAddress // Now IOTA address
				},
				logo: {
					type: "string",
					description: allFiles[0]
				},
				allFiles
			}
		}
		console.log("======================>Creating Ideas")
		try {
			const tx = new Transaction();
			// Creating Ideas in Smart contract
			await sendTransaction(tx, 'create_ideas', [tx.pure.string(JSON.stringify(createdObject)), tx.pure.u64(Number(id)), tx.pure.string(currentWalletAddress.toLocaleLowerCase())])
  await sleep(8000);

		} catch (error) {
			console.error(error)
			setLoading(false);
			CreateIdeasBTN.disabled = false;
			return
			window.location.href = "/login?[/]" //If found any error then it will let the user to login page
		}
		setLoading(false);
		window.location.href = `daos/dao/goal?[${id}]` //After the success it will redirect the user to goal page
	}

	function CreateIdeasBTN() {
		return (
			<>
				<div className="flex gap-4 justify-end">
					<Button id="CreateIdeasBTN" onClick={createIdeas}>
						<ControlsPlus className="text-moon-24" />
						Create ideas
					</Button>
				</div>
			</>
		)
	}
	function FilehandleChange(ideas) {
		// If user uploaded images/videos
		var allNames = []
		for (let index = 0; index < ideas.target.files.length; index++) {
			const element = ideas.target.files[index].name
			allNames.push(element)
		}
		for (let index2 = 0; index2 < ideas.target.files.length; index2++) {
			setIdeasImage(pre => [...pre, ideas.target.files[index2]])
		}
	}
	if (!isServer()) {
		const regex = /\[(.*)\]/g
		const str = decodeURIComponent(window.location.search)
		let m

		while ((m = regex.exec(str)) !== null) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (m.index === regex.lastIndex) {
				regex.lastIndex++
			}
			id = m[1]
		}
	}
	async function CheckTransaction() {
		let params = new URL(window.location).searchParams
		if (params.get("transactionHashes") !== null) {
			window.location.href = `daos/dao/goal?[${id}]`
		}
	}

	CheckTransaction()

	function AddBTNClick(ideas) {
		//Clicking on +(Add) Function
		var IdeasImagePic = document.getElementById("IdeasImage")
		IdeasImagePic.click()
	}

	function DeleteSelectedImages(ideas) {
		//Deleting the selected image
		var DeleteBTN = ideas.currentTarget
		var idImage = Number(DeleteBTN.getAttribute("id"))
		var newImages = []
		var allUploadedImages = document.getElementsByName("deleteBTN")
		for (let index = 0; index < IdeasImage.length; index++) {
			if (index != idImage) {
				const elementDeleteBTN = allUploadedImages[index]
				elementDeleteBTN.setAttribute("id", newImages.length.toString())
				const element = IdeasImage[index]
				newImages.push(element)
			}
		}
		setIdeasImage(newImages)
	}

	return (
		<>
			<Head>
				<title>Create Ideas</title>
				<meta name="description" content="Create Ideas" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Header></Header>
			<div className={`${styles.container} flex items-center justify-center flex-col gap-8`}>
				<div className={`${styles.title} gap-8 flex flex-col`}>
					<h1 className="text-moon-32 font-bold">Create ideas</h1>
				</div>
				<div className={styles.divider}></div>
				<div className={`${styles.form} flex flex-col gap-8`}>
					<div>
						<h6>Ideas name</h6>
						{IdeasTitleInput}
					</div>

					<div>
						<h6>Description</h6>
						{IdeasDescriptionInput}
					</div>

					<div className="flex flex-col gap-2 h-56">
						<h6>Content</h6>
						<div
							style={{ borderColor: "#6578F2" }}
							className="border-4 border-dashed content-start flex flex-row flex-wrap gap-4 h-full inset-0 justify-start m-auto overflow-auto p-1 relative text-center text-white w-full z-20">
							<input className="file-input" hidden onChange={FilehandleChange} id="IdeasImage" name="IdeasImage" type="file" multiple="multiple" />
							<div className="flex gap-4">
								{IdeasImage.map((item, i) => {
									return (
										<>
											<div key={i} className="flex gap-4">
												<button onClick={DeleteSelectedImages} name="deleteBTN" id={i}>
													{item.type.includes("image") ? (
														<img className={styles.image} src={URL.createObjectURL(item)} />
													) : (
														<>
															<div className={styles.video}>
																<span className="Ideas-Uploaded-File-name">{item.name.substring(0, 10)}...</span>
															</div>
														</>
													)}
												</button>
											</div>
										</>
									)
								})}
								<div className="Ideas-ImageAdd">
									<Button id="Add-Image" onClick={AddBTNClick} variant="secondary" style={{ height: 80, padding: "1.5rem" }} iconLeft size="lg">
										<GenericPicture className="text-moon-24" />
										Add Content
									</Button>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<h6>Rules</h6>

						<div className="content-start gap-8 flex flex-row flex-wrap h-full justify-start ">
							<div className="flex gap-8 w-full">
								<div className="flex-1">{Qoutation1Input}</div>
								<div className="flex-1">{Qoutation2Input}</div>
							</div>

							<Button>
								<ControlsPlus className="text-moon-24" />
								Add smart contract
							</Button>
						</div>
					</div>

					<CreateIdeasBTN />
				</div>
			</div>
			<Loader show={loading} text="Creating Ideas..." />
		</>
	)
}
