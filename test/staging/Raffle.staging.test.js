const { network, ethers, getNamedAccounts, deployments } = require("hardhat");
const { networkConfig, developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test case", function () {
          let raffle, raffleEntranceFee, deployer;

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              raffle = await ethers.getContract("Raffle", deployer);
              raffleEntranceFee = await raffle.getEntranceFee();
          });

          describe("Fulfill Random Words", async function () {
              it("1) Works wil live chain link keepers, and vrf contracts", async function () {
                  console.log("Setting up test");
                  const startingTimeStamp = await raffle.getLastTimeStamp();
                  const accounts = await ethers.getSigners();
                  await new Promise(async (resolve, reject) => {
                      console.log("Setting up listeners");
                      raffle.once("WinnerPicked", async () => {
                          console.log("Winner picked! Event fired!");
                          try {
                              const recentWinner = await raffle.getRecentWinner();
                              const raffleState = await raffle.getRaffleState();
                              const winnerEndingBalance = await accounts[0].getBalance();
                              const endingTimeStamp = await raffle.getLastTimeStamp();

                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(recentWinner.toString(), accounts[0].address);
                              assert.equal(raffleState, 0);
                              assert(endingTimeStamp > startingTimeStamp);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              );
                              resolve();
                          } catch (err) {
                              reject();
                          }
                      });

                      console.log("Entering Raffle");
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee });
                      await tx.wait(1);
                      console.log("Waiting for transaction to be completed");
                      const winnerStartingBalance = await accounts[0].getBalance();
                  });
              });
          });
      });
