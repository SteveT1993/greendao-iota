import React, { useState, useEffect } from "react";
import { useWallets, useConnectWallet, useCurrentAccount } from "@iota/dapp-kit";
import { Header } from "../../components/layout/Header";
import Head from "next/head";
import styles from "./Login.module.scss";
import Button from "@heathmont/moon-core-tw/lib/button/Button";
import GenericClose from "@heathmont/moon-icons-tw/icons/GenericClose";
import GenericCheckRounded from "@heathmont/moon-icons-tw/icons/GenericCheckRounded";
import isServer from "../../components/isServer";

let redirecting = "";
export default function Login() {
 
  const [ConnectStatus, setConnectStatus] = useState(false);
  // dApp Kit hooks
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  const connect = useConnectWallet();

  if (!isServer()) {
    const regex = /\[(.*)\]/g;
    const str = decodeURIComponent(window.location.search);
    let m;

    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      redirecting = m[1];
    }
  }



  const fetchDataStatus = async () => {
  if (window.localStorage.getItem("login-type") == "iota") {
      setConnectStatus(true);
    } else {
      setConnectStatus(false);
    }

  };
  useEffect(() => {
    if (!isServer()) {
      setInterval(() => {
        if (window.localStorage.getItem("loggedin") == "true") {

          window.location.href = redirecting;
        }
        fetchDataStatus();
      }, 1000);
    }
  }, []);
  if (isServer()) return null;


  function IotaWallet() {
    // Use dApp Kit to check for available wallets
    if (!wallets || wallets.length === 0) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://d315pvdvxi2gex.cloudfront.net/528399e23c1bb7b14cced0b89.png" alt="IOTA Wallet" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">IOTA Wallet</span>
            </div>
            <Button onClick={onClickConnect} style={{ width: 148 }}>
              Install IOTA Wallet
            </Button>
          </div>
        </>
      );
    }
    if (!ConnectStatus) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{ borderRadius: '1rem' }}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://d315pvdvxi2gex.cloudfront.net/528399e23c1bb7b14cced0b89.png" alt="IOTA Wallet" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">IOTA Wallet</span>
              <span
                className="flex items-center gap-1 " style={{ color: 'rgb(255, 78, 100)' }}
              >
                <GenericClose className="text-moon-32 " />
                Disconnected
              </span>
            </div>
            <Button onClick={onClickConnect} style={{ width: 112 }}>
              Connect
            </Button>
          </div>
        </>
      );
    }
    if (ConnectStatus) {
      return (
        <>
          <div className="border flex gap-6 items-center p-2 w-full" style={{borderRadius: '1rem'}}>
            <div
              style={{ height: 80, width: 80, border: "1px solid #EBEBEB" }}
              className="p-4 rounded-xl"
            >
              <img src="https://d315pvdvxi2gex.cloudfront.net/528399e23c1bb7b14cced0b89.png" alt="IOTA Wallet" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-bold">IOTA Wallet</span>
              <span
                className="flex items-center gap-1"
                style={{ color: "#40A69F" }}
              >
                <GenericCheckRounded className="text-moon-32" color="#40A69F" />
                Connected
              </span>
            </div>
          </div>
        </>
      );
    }
  }

  async function onClickConnect() {
    if (!wallets || wallets.length === 0) {
      window.open("https://chromewebstore.google.com/detail/iota-wallet/iidjkmdceolghepehaaddojmnjnkkija", "_blank");
      return;
    }
    try {
      const result = await connect.mutateAsync({ wallet: wallets[0] });
      const accounts = result?.accounts ?? [];
      if (accounts && accounts.length > 0) {
        window.localStorage.setItem("loggedin", "true");
        window.localStorage.setItem("login-type", "iota");
        setConnectStatus(true);
      }
    } catch (error) {
      console.error(error);
    }
  }





  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="GreenDAO - Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header></Header>
      <div className={`${styles.container} flex items-center flex-col gap-8`}>
        <div className={`${styles.title}  flex flex-col`}>
          <h1 className="text-moon-32  font-bold">Login to your account</h1>
          <p className="text-trunks mt-4">Please connect to IOTA Wallet in order to login.</p>

        </div>
        <div className={styles.divider}></div>
        <div className={`${styles.title} flex flex-col items-center gap-8 `}>
          <IotaWallet />
        </div>

      </div>
    </>
  );
}
