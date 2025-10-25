import React, { useState } from "react";
import Head from "next/head";
import UseFormInput from "../../components/components/UseFormInput";
import UseFormTextArea from "../../components/components/UseFormTextArea";
import { Header } from "../../components/layout/Header";
import NavLink from "next/link";
import { useRouter } from "next/router";
import useContract from '../../services/useContract'
import isServer from "../../components/isServer";
import styles from "./CreateDao.module.css";
import { Button } from "@heathmont/moon-core-tw";
import { GenericPicture, ControlsPlus } from "@heathmont/moon-icons-tw";
import { Checkbox } from "@heathmont/moon-core-tw";

import { useIPFSContext } from '../../contexts/IPFSContext';

export default function CreateDao() {
  const [DaoImage, setDaoImage] = useState([]);
  const { contract, signerAddress, sendTransaction,formatTemplate } = useContract()
  const router = useRouter();
  const {UploadBlob} = useIPFSContext(); 

  //Input fields
  const [DaoTitle, DaoTitleInput] = UseFormInput({
    defaultValue: "",
    type: "text",
    placeholder: "Add name",
    id: "",
  });

  const [DaoDescription, DaoDescriptionInput] = UseFormTextArea({
    defaultValue: "",
    placeholder: "Add Description",
    id: "",
    rows: 4,
  });

  const [StartDate, StartDateInput] = UseFormInput({
    defaultValue: "",
    type: "datetime-local",
    placeholder: "Start date",
    id: "startdate",
  });

  const [SubsPrice, SubsPriceInput] = UseFormInput({
    defaultValue: "",
    type: "text",
    placeholder: "Price(HBAR) Per Month",
    id: "subs_price",
  });

  if (isServer()) return null;

  //Downloading plugin function
  function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  CheckTransaction();

  //Creating plugin function
  async function CreatePlugin(src) {
    const output = `<html><head></head><body><iframe src="${src}" style="width: 100%;height: 100%;" /></body></html>`;
    // Download it
    const blob = new Blob([output]);
    const fileDownloadUrl = URL.createObjectURL(blob);
    downloadURI(fileDownloadUrl, "Generated Plugin.html");
    console.log(output);
  }

  async function CheckTransaction() {
    let params = (new URL(window.location)).searchParams;
    if (params.get("transactionHashes") !== null) {
      window.location.href = "/daos";
    }

  }
  //Function after clicking Create Dao Button
  async function createDao() {
    var CreateDAOBTN = document.getElementById("CreateDAOBTN");
    CreateDAOBTN.disabled = true;
    let allFiles = [];
    for (let index = 0; index < DaoImage.length; index++) {
      //Gathering all files link
      const element = DaoImage[index];
      const url = element.type ? await UploadBlob(element) : '';
      const image = {
        url,
        type: element.type
      };
      allFiles.push(image)
    }

    //Creating an object of all information to store in EVM
    const createdObject = {
      title: 'Asset Metadata',
      type: 'object',
      properties: {
        Title: {
          type: 'string',
          description: DaoTitle,
        },
        Description: {
          type: 'string',
          description: DaoDescription,
        },
        Start_Date: {
          type: 'string',
          description: StartDate,
        },
        logo: {
          type: 'string',
          description: allFiles[0]
        },
        wallet: {
          type: 'string',
          description: signerAddress
        },
        SubsPrice: {
          type: 'number',
          description: SubsPrice
        },
        typeimg: {
          type: 'string',
          description: "Dao"
        },
        allFiles
      }
    };
    console.log("======================>Creating Dao");
    try {
      const valueAll = await contract.get_all_daos() //Getting dao URI from smart contract       

      // //Getting the dao id of new one
      let daoid = valueAll.length;
      if (document.getElementById("plugin").checked) {
        await CreatePlugin(
          `http://${window.location.host}/daos/dao?[${daoid}]`
        );
      }
      var template = await (await fetch(`/template/template.html`)).text();

      let changings = [{
        key: "dao-title",
        value: DaoTitle
      }, {
        key: "dao-image",
        value: allFiles[0].url
      }]
      let formatted_template = formatTemplate(template,changings)
     
      // Creating Dao in Smart contract from metamask chain
      await sendTransaction(await window.contract.populateTransaction.create_dao(signerAddress, JSON.stringify(createdObject), formatted_template));

    } catch (error) {
      console.error(error);
      return;
      // window.location.href = "/login?[/]"; //If found any error then it will let the user to login page
    }
    router.push("/daos"); //After the success it will redirect the user to /dao page
  }

  function FilehandleChange(dao) {
    var allNames = []
    for (let index = 0; index < dao.target.files.length; index++) {
      const element = dao.target.files[index].name;
      allNames.push(element)
    }
    for (let index2 = 0; index2 < dao.target.files.length; index2++) {
      setDaoImage((pre) => [...pre, dao.target.files[index2]])
    }

  }

  function AddBTNClick() {
    var DaoImagePic = document.getElementById("DaoImage");
    DaoImagePic.click();

  }

  function CreateDaoBTN() {
    return (
      <>
        <div className="flex gap-4 justify-end">
          <Button id="CreateDAOBTN" onClick={createDao}>
            <ControlsPlus className="text-moon-24" />
            Create Dao
          </Button>
        </div>
      </>
    );
  }

  function DeleteSelectedImages(dao) {
    //Deleting the selected image
    var DeleteBTN = dao.currentTarget;
    var idImage = Number(DeleteBTN.getAttribute("id"));
    var newImages = [];
    var allUploadedImages = document.getElementsByName("deleteBTN");
    for (let index = 0; index < DaoImage.length; index++) {
      if (index != idImage) {
        const elementDeleteBTN = allUploadedImages[index];
        elementDeleteBTN.setAttribute("id", newImages.length.toString());
        const element = DaoImage[index];
        newImages.push(element);
      }
    }
    setDaoImage(newImages);
  }



  return (
    <>
      <Head>
        <title>Create DAO</title>
        <meta name="description" content="Create DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header></Header>
      <div
        className={`${styles.container} flex items-center justify-center flex-col gap-8`}
      >
        <div className={`${styles.title} flex flex-col`}>
          <h1 className="text-moon-32 font-bold">Create DAO</h1>
          <p className="text-trunks">
            An dao will have its own page where people can submit their ideas.
          </p>
        </div>
        <div className={styles.divider}></div>
        <div className={`${styles.form} flex flex-col gap-8`}>
          <div>
            <h6>Dao name</h6>
            {DaoTitleInput}
          </div>

          <div>
            <h6>Description</h6>
            {DaoDescriptionInput}
          </div>
          <div className="flex gap-8 w-full">

            <div className="flex-1">
              <h6>Start Date</h6>
              {StartDateInput}
            </div>

          </div>
          <div className="flex gap-8 w-full">

            <div className="flex-1">
              <h6>Subscription Price Per Month</h6>
              {SubsPriceInput}
            </div>

          </div>
          <div className="flex flex-col gap-2">
            <h6>Images</h6>
            <div className="flex gap-4">
              <input
                className="file-input"
                hidden
                onChange={FilehandleChange}
                id="DaoImage"
                name="DaoImage"
                type="file"
                multiple="multiple"
              />
              <div className="flex gap-4">
                {DaoImage.map((item, i) => {
                  return (
                    <div key={i} className="flex gap-4">
                      <button
                        onClick={DeleteSelectedImages}
                        name="deleteBTN"
                        id={i}
                      >
                        {item.type.includes("image") ? (
                          <img
                            className={styles.image}
                            src={URL.createObjectURL(item)}
                          />
                        ) : (
                          <>
                            <div className="Dao-Uploaded-File-Container">

                              <span className="Dao-Uploaded-File-name">
                                {item.name.substring(0, 10)}...
                              </span>
                            </div>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                <div className="Dao-ImageAdd">
                  <Button
                    id="Add-Image"
                    onClick={AddBTNClick}
                    variant="secondary"
                    style={{ height: 80, padding: "1.5rem" }}
                    iconLeft
                    size="lg"
                  >
                    <GenericPicture className="text-moon-24" />
                    Add image
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Checkbox label="Generate Plugin" id="plugin" />
          </div>
          <CreateDaoBTN />
        </div>
      </div>
    </>
  );
}
