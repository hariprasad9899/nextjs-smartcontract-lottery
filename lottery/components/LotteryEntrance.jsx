import { useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "@web3uikit/core";

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
    const chainId = parseInt(chainIdHex);

    const dispatch = useNotification();
    // State values for contract information
    let [entranceFee, setEntranceFee] = useState("0");
    let [numPlayers, setNumPlayers] = useState("0");
    let [recentWinner, setRecentWinner] = useState("0");

    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0].toString() : null;
    const { runContractFunction: raffleContract } = useWeb3Contract(contractAddresses, abi);
    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    });

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    });

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    });

    const { runContractFunction: getNumOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumOfPlayers",
        params: {},
    });

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString();
        const numPlayersFromCall = (await getNumOfPlayers()).toString();
        const recentWinnerFromCall = (await getRecentWinner()).toString();
        setEntranceFee(entranceFeeFromCall);
        setNumPlayers(numPlayersFromCall);
        setRecentWinner(recentWinnerFromCall);
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI();
        }
    }, [isWeb3Enabled]);

    const handleSuccess = async (tx) => {
        await tx.wait(1);
        handleNewNotification(tx);
        updateUI();
    };

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            title: "TX Notification",
            message: "Transaction Complete",
            position: "topR",
        });
    };

    async function handleEnterRaffle() {
        await enterRaffle({
            onSuccess: handleSuccess,
            onError: (error) => console.log(error),
        });
    }

    return (
        <div>
            {raffleAddress ? (
                <div className="p-5">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 rounded ml-auto"
                        onClick={handleEnterRaffle}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div className="py-2 border-2 mt-5">
                        <h4>Entrance Fee: {ethers.utils.formatEther(entranceFee, "ether")}</h4>
                        <h3>Players: {numPlayers}</h3>
                        <h3>
                            Recent Winner: <span style={{ color: "darkgreen" }}>{recentWinner}</span>
                        </h3>
                    </div>
                </div>
            ) : (
                <div>
                    <h3>Please connect to a supported chain</h3>
                </div>
            )}
        </div>
    );
}
