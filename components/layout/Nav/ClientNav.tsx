import React, { useState, useEffect } from "react";
import { useWallets, useConnectWallet, useCurrentAccount, useDisconnectWallet } from "@iota/dapp-kit";
import NavLink from "next/link";
import { Button } from "@heathmont/moon-core-tw";
import { SoftwareLogOut } from "@heathmont/moon-icons-tw";
import isServer from "../../../components/isServer";
import { useIotaClientQuery } from '@iota/dapp-kit';
import { useIOTA } from "../../../contexts/IOTAContext";
declare let window: any;
let running = false;

export default function ClientNav() {
  const { ParseBigNumber, WrapBigNumber, Balance, currentWalletAddress } = useIOTA();
  const [acc, setAcc] = useState('');
  const [accFull, setAccFull] = useState('');
  const [isSigned, setSigned] = useState(false);

  // dApp Kit hooks (safe: this component is client-only)
  const wallets = useWallets();

  async function fetchInfo() {
    if (!wallets || wallets.length === 0) {
      try { document.getElementById("withoutSign")!.style.display = "none"; } catch { }
      try { document.getElementById("withSign")!.style.display = "none"; } catch { }
      try { document.getElementById("installIota")!.style.display = ""; } catch { }
      running = false;
      setSigned(false);
      return;
    } else {
      try { document.getElementById("withoutSign")!.style.display = ""; } catch { }
      try { document.getElementById("withSign")!.style.display = "none"; } catch { }
      try { document.getElementById("installIota")!.style.display = "none"; } catch { }
    }

    if (window.localStorage.getItem("login-type") === "iota") {
      try {
        // If there's already a current account, use it
        if (currentWalletAddress) {
          const addr = currentWalletAddress;
          let subbing = window.innerWidth > 500 ? 20 : 10;
          setAcc(addr.toString().substring(0, subbing) + "...");
          setAccFull(addr);
          try { document.getElementById("withoutSign")!.style.display = "none"; } catch { }
          try { document.getElementById("withSign")!.style.display = ""; } catch { }
          running = false;
          setSigned(true);
          return;
        }


      } catch (error) {
        console.error(error);
        running = false;
        return;
      }
    } else {

      try { document.getElementById("withoutSign")!.style.display = ""; } catch { }
      try { document.getElementById("withSign")!.style.display = "none"; } catch { }
    }
    setSigned(false);
    running = false;
  }


  useEffect(() => {
    setInterval(() => {
      if (!isServer()) {
        if (document.readyState === "complete" && !running) {
          if (!running && !isSigned) {
            running = true;
            fetchInfo();
          }
        }
      }
    }, 1000);
  }, []);

  async function onClickDisConnect() {
    window.localStorage.setItem("loggedin", "");
    window.localStorage.setItem('login-type', "");
    window.location.href = "/";
  }

  return (
    <nav className="main-nav w-full flex justify-between items-center">
      <ul className="flex justify-between items-center w-full">
        {isSigned ? (<>

          <li>
            <a href="/daos" >
              <Button style={{ background: 'none', border: '0px', color: 'white' }}> DAO</Button>
            </a>
          </li>
          <li>
            <a href="/CreateDao">
              <Button style={{ background: 'none', border: '0px', color: 'white' }}>Create DAO</Button>
            </a>
          </li>
        </>) : (<></>)}

        <li className="Nav walletstatus flex flex-1 justify-end">
          <div className="py-2 px-4 flex row items-center" id="withoutSign">
            <a href="/login?[/]">
              <Button variant="tertiary">Log in</Button>
            </a>
          </div>
          <div
            id="installIota"
            style={{ display: "none" }}
            className="wallets"
          >
            <div className="wallet">
              <Button variant="tertiary" onClick={() => { window.open("https://chromewebstore.google.com/detail/iota-wallet/iidjkmdceolghepehaaddojmnjnkkija", "_blank") }}> IOTA Wallet</Button>
            </div>
          </div>

          <div id="withSign" className="wallets" style={{ display: "none" }}>
            <div className="wallet" style={{ height: 48, display: "flex", alignItems: "center" }}>
              <div className="wallet__wrapper gap-4 flex items-center">
                <div className="wallet__info flex flex-col items-end">
                  <a href={"/Profile/" + accFull} rel="noreferrer" className="text-primary">
                    <div className="font-medium " style={{ color: 'var(--title-a-text)' }}>{acc}</div>
                  </a>
                  <div className="text-goten">{Balance}</div>
                </div>
                <Button iconOnly onClick={onClickDisConnect}>
                  <SoftwareLogOut
                    className="text-moon-24"
                    transform="rotate(180)"
                  ></SoftwareLogOut>
                </Button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  );
}
