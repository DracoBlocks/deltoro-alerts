import * as fs from "fs";
import fetch from "node-fetch";
import Web3 from "web3";
import { Contract } from "./contract.js";

import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const SLACK_HOOK_URL = process.env.SLACK_HOOK_URL;

const web3 = new Web3(Contract.rpcUrls[0]);
const contract = new web3.eth.Contract(Contract.abi, Contract.address);

/**
 * 
 * @returns An object with the public information
  struct PublicInfo {
    uint256 lastTokenId;
    uint256 lastMinted;
    uint256 tokensBurned;
    uint256 nftPrice;
    uint256 saleFinishTime;
    bool nftSaleFinished;
    string baseURI;
  }
 */
const getPublicInfo = async () => {
  return contract.methods.getPublicInfo().call();
};

const lastTokenFile = "lastTokenId.txt";

(async () => {
  fs.readFile(lastTokenFile, function (err, buf) {
    let lastTokenId = 1;
    if (!err) {
      lastTokenId = +buf;
    }

    const updateStats = () => {
      getPublicInfo()
        .then((info) => {
          if (info.lastTokenId > lastTokenId) {
            const sold = info.lastTokenId - lastTokenId;
            const total = info.lastTokenId;

            const message = `We have sold ${sold} NFTs more!\nTotal NFTs sold: ${
              total - 1
            }\nTotal money raised for La Palma: ${(total - 1) * 20 * 0.8}€`;

            const payload = {
              text: message,
              channel: SLACK_CHANNEL,
            };

            fetch(SLACK_HOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
              .then(() => {
                lastTokenId = info.lastTokenId;
                fs.writeFile(lastTokenFile, total, (err) => {
                  if (err) console.log(err);
                });
              })
              .catch((error) => {
                console.log("Error posting event to Slack", error);
              });
          }
        })
        .catch((error) => {
          console.log("An error occured", error);
        });
    };

    updateStats();
    setInterval(updateStats, 300 * 1000);
  });
})();
