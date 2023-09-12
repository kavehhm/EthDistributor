import { Inter } from "next/font/google";
import { ConnectWallet, useSigner } from "@thirdweb-dev/react";
import { useState, useEffect } from "react";
import { useSDK, useAddress } from "@thirdweb-dev/react";
import { ethers } from "ethers";

const inter = Inter({ subsets: ["latin"] });
const CONTRACTADDRESS = "0x2405C633F751607A51a40b3B1E4a5eB3704cF751";

export default function Home() {
  const address = useAddress();
  const signer = useSigner();
  const sdk = useSDK();
  const provider = new ethers.providers.AlchemyProvider(
    "goerli",
    "1ne-0BTmtf5nroo3t976uAwBRJ7EzLdg"
  );
  const [recipients, setRecipients] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [contractBalance, setContractBalance] = useState("0");
  const [totalBeingSent, setTotalBeingSent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0)

  let abi = [
    "function approve(address[] memory receivers, uint[] memory amounts)",
  ];

  const ethersContract = new ethers.Contract(CONTRACTADDRESS, abi, signer);

  function sumNumbersInArrayOfObjects() {
    let total = 0;

    for (let i = 0; i < recipients.length; i++) {
      if (typeof recipients[i] === "object" && "quantity" in recipients[i]) {
        total += parseFloat(recipients[i].quantity);
      }
    }

    setTotalBeingSent(total);
  }

  

  useEffect(() => {
    const run = async () => {
      setContractBalance(await provider.getBalance(CONTRACTADDRESS));
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if(signer)
      {

        setUserBalance(await signer.getBalance());
      }
      else {
        setUserBalance(0)
      }
    };
    run();
  }, [signer]);
  

  useEffect(() => {
    sumNumbersInArrayOfObjects();
  }, [recipients]);

  const sendToContract = async () => {
    setLoading(true);
    if (depositAmount) {
      const transferToContract = await sdk.wallet.transfer(
        CONTRACTADDRESS,
        depositAmount
      );
      setContractBalance(await provider.getBalance(CONTRACTADDRESS));

      console.log(transferToContract.receipt.status);
    }
    setLoading(false);
  };

  const distributeFunds = async () => {
    setLoading(true);
    const recipientsArray = [];
    const quantitiesArray = [];

    for (let i = 0; i < recipients.length; i++) {
      if (
        typeof recipients[i] === "object" &&
        "recipient" in recipients[i] &&
        "quantity" in recipients[i]
      ) {
        recipientsArray.push(recipients[i].recipient);
        quantitiesArray.push(
          ethers.utils.parseUnits(
            parseFloat(recipients[i].quantity).toString(),
            "ether"
          )
        );
      }
    }

    // mutateAsync({args: [recipientsArray, quantitiesArray]})
    const approvalTx = await ethersContract.approve(
      recipientsArray,
      quantitiesArray
    );
    await approvalTx.wait();
    const newBalance = await provider.getBalance(CONTRACTADDRESS);
    setContractBalance(newBalance);
    setLoading(false);
  };

  const addRecipientHandler = () => {
    if (ethers.utils.isAddress(recipient)) {
      setRecipients((prevArray) => {
        const index = prevArray.findIndex((obj) => obj.recipient === recipient);

        if (index !== -1) {
          // If the object exists, update its values
          const updatedArray = [...prevArray];
          updatedArray[index] = {
            ...prevArray[index],
            quantity: (
              parseFloat(prevArray[index].quantity) + parseFloat(amount)
            ).toFixed(3),
          };
          return updatedArray;
        } else {
          // If the object does not exist, add it to the array
          return [
            { recipient, quantity: parseFloat(amount).toFixed(3) },
            ...prevArray,
          ];
        }
      });
    }

    setRecipient("")
    setAmount(0)

    console.log(recipients);
  };

  const handleRemoval = (address) => {
    setRecipients((prev) =>
      prev.filter((receiver) => receiver.recipient != address)
    );
  };
  return (
    <main
      className={`flex min-h-screen flex-col items-center  gap-y-6 p-24 ${inter.className}`}
    >
      <ConnectWallet switchToActiveChain />

      {loading && <p>loading...</p>}
      <div className="flex gap-x-12">
        <p className="bg-teal-200 rounded-lg p-6 text-black">
          {ethers.utils.formatEther(contractBalance)} ETH in contract
        </p>
        <p className="bg-amber-200 rounded-lg p-6 text-black">
          {totalBeingSent.toFixed(3)} ETH being sent
        </p>
      </div>
      <div className="gap-x-3 flex">
        <input
          className="rounded text-black w-64 px-2 py-3"
          placeholder="Enter deposit amount (eth)"
          required
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button
          onClick={sendToContract}
          disabled={depositAmount == 0 || depositAmount > ethers.utils.formatEther(userBalance)}
          className="rounded disabled:bg-gray-500 w-64 px-2 py-3 bg-cyan-600 hover:bg-cyan-700"
        >
          {depositAmount < ethers.utils.formatEther(userBalance) ? "Send to contract" : "Not enough funds"}
        </button>
      </div>
      <div className="flex gap-y-3 flex-col">
        <div className="flex gap-x-3">
          <input
            className="rounded text-black w-64 px-2 py-3"
            placeholder="Enter recipient wallet"
            value={recipient}
            required
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            className="rounded text-black w-64 px-2 py-3"
            placeholder="Enter recipient amount (eth)"
            required
            value={amount}
            type="number"
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={() => addRecipientHandler()}
            disabled={!ethers.utils.isAddress(recipient)}
            className="rounded w-64 disabled:bg-gray-500 px-2 py-3 bg-cyan-600 hover:bg-cyan-700"
          >
            {ethers.utils.isAddress(recipient)
              ? "Add to airdrop"
              : "Enter a valid address"}
          </button>
        </div>
        <button
          onClick={distributeFunds}
          disabled={
            totalBeingSent > ethers.utils.formatEther(contractBalance) ||
            recipients.length == 0
          }
          className="rounded disabled:bg-gray-500 w-full text-center px-2 py-3 bg-green-600 hover:bg-green-700"
        >
          {recipients.length == 0 && "Add recipients to begin airdrop"}
          {totalBeingSent > ethers.utils.formatEther(contractBalance) &&
            "Amount being sent exceeds contract balance"}
          {totalBeingSent <= ethers.utils.formatEther(contractBalance) &&
            recipients.length > 0 &&
            "Send airdrops"}
        </button>
      </div>

      <div className="flex flex-col gap-y-3">
        {recipients.map((receiver) => (
          <div key={receiver} className="flex items-center gap-x-2">
            <div className="truncate w-24">{receiver.recipient}</div>
            <div>{receiver.quantity} ETH</div>
            <button
              className="bg-red-600 text-white cursor-pointer rounded px-3 py-2 hover:bg-red-700"
              onClick={() => handleRemoval(receiver.recipient)}
            >
              remove
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
