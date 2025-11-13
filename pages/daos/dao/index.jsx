import React, { useState, useEffect } from "react";
import { createRoot } from 'react-dom/client';
import { useRouter } from 'next/router';


import Head from "next/head"
import useContract from "../../../services/useContract"
import { Header } from "../../../components/layout/Header"
import isServer from "../../../components/isServer"
import styles from "../daos.module.css"
import Card from "../../../components/components/Card/Card"
import { ControlsPlus, ControlsChevronRight, ControlsChevronLeft } from "@heathmont/moon-icons-tw"
import { Button } from "@heathmont/moon-core-tw"
import Skeleton from "@mui/material/Skeleton"
import JoinDAO from "../../../components/components/modal/JoinDAO";
import { useIOTA } from "../../../contexts/IOTAContext";
import Loader from '../../../components/Loader/Loader'
let running = true
export default function DAO() {
	//Variables
	const [list, setList] = useState([])
	const [DaoURI, setDaoURI] = useState({ Title: "", Description: "", SubsPrice: 0, Start_Date: "", End_Date: "", logo: "", wallet: "", typeimg: "", allFiles: [], isOwner: false })
	const [daoId, setDaoID] = useState(-1)
	const { daos, sleep, currentWalletAddress, getGoalsForDao, getUserBadge } = useIOTA()
	const router = useRouter();
	const [JoinmodalShow, setJoinmodalShow] = useState(false);
	const [isJoined, setIsJoined] = useState(true)

	// use shared sleep from IOTA context
	const regex = /\[(.*)\]/g
	let m
	let id = "" //id from url

	useEffect(() => {
		fetchContractData();
	}, [daos])

	useEffect(() => {
		if (document.getElementById("goal-container")) {
			const root = createRoot(document.getElementById("goal-container"));
			root.render(goal(list));
		}
	}, [list]);

	if (isServer()) return null
	
	// Modern route: /daos/[daoId]
	if (router.query.daoId) {
		id = router.query.daoId;
	} else {
		// Legacy route: /daos/dao?[daoId]
		const str = decodeURIComponent(window.location.search)
		while ((m = regex.exec(str)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++
			}
			id = m[1]
		}
	}
	function calculateTimeLeft() {
		//Calculate time left
		try {
			var allDates = document.getElementsByName("DateCount")
			for (let i = 0; i < allDates.length; i++) {
				var date = allDates[i].getAttribute("date")
				var status = allDates[i].getAttribute("status")
				allDates[i].innerHTML = LeftDate(date, status)
			}
		} catch (error) { }
	}

	async function JoinCommunity() {
		setJoinmodalShow(true);
	}

	const goal = (list) => list.map((listItem, index) => (
		<Card height={300} width={640} key={index} className="p-10">
			<div className="flex flex-col gap-8 w-full">
				<div className="flex gap-6 w-full">
					<span className={styles.image}>
						<img alt="" src={listItem.logo} />
					</span>
					<div className="flex flex-col gap-2 overflow-hidden text-left">
						<div className="font-bold">{listItem.Title}</div>
						<div>Budget {listItem.Budget}</div>
					</div>
				</div>
				<div className="flex justify-between align-center">
					<div name="DateCount" date={listItem.End_Date} status={listItem.status} className="flex items-center font-bold">
						{LeftDate(listItem.End_Date, listItem.status)}
					</div>

					<a href={`/daos/${daoId}/goals/${listItem.goalId}`}>
						<Button iconLeft>
							<ControlsChevronRight />
							Go to Goal
						</Button>
					</a>
				</div>
			</div>
		</Card>
	))


	async function fetchContractData() {
		running = true;
		//Fetching data from Smart contract
		try {
			if (daos && daos.length > 0 && id) {
				setDaoID(Number(id))

				let isJoinedTemp = false;
				const dao = daos.find(d => {
					// Match using the new numeric dao_id field when available, otherwise fall back to uid string
					const numeric = d.dao_id ?? (d.id && d.id.id) ?? d.id;
					return String(numeric) === String(id);
				});
				if (dao) {
					const daoURI = JSON.parse(dao.dao_uri);

					let daoURIShort = {
						Title: daoURI.title,
						Description: daoURI.description,
						Start_Date: daoURI.start_date,
						logo: daoURI.logo,
						wallet: dao.dao_wallet,
						typeimg: daoURI.typeimg,
						allFiles: daoURI.allFiles,
						SubsPrice: daoURI.subs_price,
						isOwner: dao.dao_wallet.toString().toLocaleLowerCase() === currentWalletAddress.toString().toLocaleLowerCase() ? true : false
					};
					setDaoURI(daoURIShort);
					// Determine joined status for current wallet
					try {
						if (currentWalletAddress) {
							const badge = await getUserBadge(currentWalletAddress.toString());
							isJoinedTemp =(!!(badge && badge.joined));
						} else {
							isJoinedTemp = (false);
						}
					} catch (e) {
						console.warn('Failed to determine join status', e);
						isJoinedTemp = (false);
					}

					// Fetch goals for this DAO
					const goals = await getGoalsForDao(Number(id));
					const mappedGoals = goals.map(g => ({
						goalId: g.goalId,
						Title: g.properties?.Title?.description || g.Title,
						Budget: g.properties?.Budget?.description || g.Budget,
						End_Date: g.properties?.End_Date?.description || g.End_Date,
						status: "Active", // Assuming active for now
						logo: g.properties?.logo?.description?.url || g.logo
					}));
					setList(mappedGoals);

					if (document.querySelector("#dao-container")) {
						document.querySelector("#dao-container").innerHTML = dao.template;
					}
					if (document.querySelector(".btn-back") != null) {
						document.querySelector(".btn-back").addEventListener('click', () => {
							window.history.back();
						});
					}
					let join_community_block = document.querySelector(".join-community-block");
					let create_goal_block = document.querySelector(".create-goal-block");
					if (create_goal_block != null) {
						document.querySelector(".create-goal-block").addEventListener('click', () => {
							window.location.href = `/CreateGoal?daoId=${id}`;
						});
					}

					if (join_community_block != null) {
						join_community_block.addEventListener('click', JoinCommunity);
					};


					if (daoURIShort.isOwner || isJoinedTemp) {
						if (join_community_block != null) {
							join_community_block.style.display = "none";
						}
					}
					if ( !daoURIShort.isOwner && !isJoinedTemp ) {
						if (create_goal_block != null) {
							create_goal_block.style.display = "none";
						}
					}
					setIsJoined(isJoinedTemp);

					if (document.getElementById("Loading")) document.getElementById("Loading").style = "display:none";
				}
			}
		} catch (error) {
			console.error(error);
		}
		running = false
	}

	function LeftDate(datetext, status) {
		//Counting Left date in date format
		var c = new Date(datetext).getTime()
		var n = new Date().getTime()
		var d = c - n
		var da = Math.floor(d / (1000 * 60 * 60 * 24))
		var h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		var m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60))
		var s = Math.floor((d % (1000 * 60)) / 1000)
		if (s.toString().includes("-") && status === "Finished") {
			return "Dao Ended"
		}
		return da.toString() + " Days " + h.toString() + " hours " + m.toString() + " minutes " + s.toString() + " seconds" + " Left"
	}
	function Loader({ element, type = "rectangular", width = "50vw", height = "90vh" }) {
		if (running) {
			return <Skeleton variant={type} width={width} height={height} />
		} else {
			return element
		}
	}
	return (
		<>
			<Header></Header>
			<Loader show={running} text={"Loading DAO..."} />
			<Head>
				<title>DAO</title>
				<meta name="description" content="DAO" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div id="dao-container">

			<div style={{display:'flex',alignItems:'center', justifyContent:'center', justifyItems:'center', marginTop:'1rem'}}><Loader></Loader></div>
			</div>


			
			<JoinDAO
				Amount={DaoURI.SubsPrice}
				show={JoinmodalShow}
				onHide={() => {
					setJoinmodalShow(false);
				}}
				address={DaoURI.wallet}
				title={DaoURI.Title}
				dao_id={daoId}
			/>
		</>
	)
}
