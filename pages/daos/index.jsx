import React, { useState, useEffect } from "react"
import Head from "next/head"
import Image from "next/image"
import NavLink from "next/link"
import useContract from "../../services/useContract"
import { Header } from "../../components/layout/Header"
import isServer from "../../components/isServer"
import styles from "./daos.module.css"
import Card from "../../components/components/Card/Card"
import { ControlsChevronRight,GenericEdit } from "@heathmont/moon-icons-tw"
import { Button } from "@heathmont/moon-core-tw"
import Skeleton from "@mui/material/Skeleton"
import { useIOTA } from "../../contexts/IOTAContext";
import Loader from '../../components/Loader/Loader'

let running = true
export default function DAOs() {
	//Variables
	const [list, setList] = useState([])
	const { contract } = useContract()
	const { daos } = useIOTA()

	useEffect(() => {
		fetchContractData()
	}, [daos])

	setInterval(function () {
		calculateTimeLeft()
	}, 1000)

	if (isServer()) return null

	function calculateTimeLeft() {
		//Calculate time left
		try {
			var allDates = document.getElementsByName("DateCount")
			for (let i = 0; i < allDates.length; i++) {
				var date = allDates[i].getAttribute("date")
				var status = allDates[i].getAttribute("status")
				allDates[i].innerHTML = LeftDate(date, status)
			}
		} catch (error) {}
	}

	async function fetchContractData() {
		running = true
		
		//Fetching data from Smart contract
		try {
			if (daos && daos.length > 0) {
				const arr = daos.map(d => {
					const daoURI = JSON.parse(d.dao_uri);
					// Prefer numeric dao_id if present, otherwise fall back to object UID
					const numericId = d.dao_id ?? (d.id && d.id.id) ?? d.id;
					return {
						daoId: numericId,
						Title: daoURI.title,
						Start_Date: daoURI.start_date,
						logo: daoURI.logo,
						wallet: d.dao_wallet,
						SubsPrice: daoURI.subs_price,
					};
				});
				setList(arr);
				if (document.getElementById("Loading"))  document.getElementById("Loading").style = "display:none";
			}
							if (document.getElementById("Loading"))  document.getElementById("Loading").style = "display:none";

		} catch (error) {
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
		return da.toString() + " Days " + h.toString() + " hours " + m.toString() + " minutes " + s.toString() + " seconds" + "Left"
	}
	function Loader({ element, type = "rectangular", width = "50", height = "23", many=1 }) {
		if (running) {
      let allElements = [];
      for (let i=0; i < many; i++){
        allElements.push( <Skeleton key={i} variant={type} width={width} height={height} />)
      }		
      return allElements;	
		} else {
      return element;
		}
	}
	return (
		<>
			<Header></Header>
			<Loader show={running} text={"Loading DAOs..."} />
			<Head>
				<title>DAO</title>
				<meta name="description" content="DAO" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={`${styles.container} flex items-center flex-col gap-8`}>
				<div className={`${styles.title} gap-8 flex flex-col`}>
					<h1 className="text-moon-32 font-bold">All DAO</h1>

					<div className={`${styles.tabs} flex gap-4`}>
						<NavLink href="?q=All">
							<a className="DonationBarLink tab block px-3 py-2 active">All</a>
						</NavLink>
						<NavLink href="?q=Today">
							<a className="DonationBarLink tab block px-3 py-2">Today</a>
						</NavLink>
						<NavLink href="?q=This Month">
							<a className="DonationBarLink tab block px-3 py-2">This Month</a>
						</NavLink>
					</div>
				</div>

				<div className={styles.divider}></div>
        <div className="flex flex-col gap-8">
				<Loader
					element={				
							list.map((listItem, index) => (
								<Card height={300} width={640} key={index} className="p-10">
									<div className="flex flex-col gap-8 w-full">
										<div className="flex gap-6 w-full">
											<span className={styles.image}>
												<img alt="" src={listItem.logo} />
											</span>
											<div className="flex flex-col gap-2 overflow-hidden text-left">
												<div className="font-bold">{listItem.Title}</div>
												<div className="whitespace-nowrap truncate">
													Organised by&nbsp;
													{listItem.wallet != window?.accountId ? listItem.wallet : <>(Me)</>}
												</div>
												<div className="whitespace-nowrap truncate">
													Subscription :
													IOTA {listItem.SubsPrice }/mo
												</div>
											</div>
										</div>
										<div className="flex align-center flex justify-end align-center gap-2">
											<a href={`/DesignDao?[${listItem.daoId}]`}>
												<Button iconLeft>
													<GenericEdit />
													Customize
												</Button>
											</a>
											<a href={`/daos/dao?[${listItem.daoId}]`}>
												<Button iconLeft>
													<ControlsChevronRight />
													Go to Dao
												</Button>
											</a>
										</div>
									</div>
								</Card>
							))					
					}
					width={640}
					height={300}
          many={3}
          type='rounded'
				/>	</div>
			</div>
		</>
	)
}
