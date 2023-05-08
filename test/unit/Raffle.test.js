const { network, ethers, getNamedAccounts, deployments } = require("hardhat");
const { networkConfig, developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", function () {
          let raffle, vrfCoordinatorV2Mock, chainId, deployer, raffleEntranceFee, interval;
          chainId = network.config.chainId;
          console.log(network.config);

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
              raffleEntranceFee = await raffle.getEntranceFee();
              interval = await raffle.getInterval();
          });

          describe("Constructor", function () {
              it("1) Initialize the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState();
                  const entranceFee = await raffle.getEntranceFee();
                  const raffleInterval = await raffle.getInterval();
                  assert.equal(raffleState.toString(), "0");
                  assert.equal(entranceFee.toString(), networkConfig[chainId]["entranceFee"]);
                  assert.equal(raffleInterval.toString(), networkConfig[chainId]["interval"]);
              });
          });

          describe("Enter Raffle", function () {
              it("2) Reverts when you dont pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughEthEntered");
              });

              it("3) It records, when player entered", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  const player = await raffle.getPlayer(0);
                  assert.equal(player.toString(), deployer.toString());
              });

              it("4) It emits event when player entered", async function () {
                  expect(await raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(raffle, "RaffleEntered");
              });

              it("5) It do not perform upkeep when calculating", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  await raffle.performUpkeep([]);
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith("Raffle__NotOpen");
              });
          });

          describe("Checkupkeep", function () {
              it("6) Returns false if people haven't send any eth", async function () {
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.equal(upkeepNeeded, false);
              });

              it("7) Returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  await raffle.performUpkeep([]);
                  let raffleState = await raffle.getRaffleState();
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.equal(upkeepNeeded, false);
              });

              it("8) Returns false if enough time isn't passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval - 5]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.equal(upkeepNeeded, false);
              });

              it("9) Returns true, if enough time passed, has players, and state is open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.equal(upkeepNeeded, true);
              });
          });

          describe("PerformUpKeep", function () {
              it("10) It can only run, if the checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  const tx = await raffle.performUpkeep([]);
              });

              it("11) Reverts when checkupkeep is false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle_UpkeepNotNeeded");
              });

              it("12) Updates the raffle state, emits an event and call vrf", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  const tx = await raffle.performUpkeep([]);
                  const txReceipt = await tx.wait(1);
                  const raffleState = await raffle.getRaffleState();
                  const requestId = await txReceipt.events[1]["args"]["requestId"];
                  assert(requestId.toNumber() > 0);
                  assert.equal(raffleState.toString(), "1");
              });
          });

          describe("13) Fulfill random words", async function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
              });

              it("13) It can only be called after perform Upkeep", async function () {
                  await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith(
                      "nonexistent request"
                  );
              });

              it("14) Picks a winner, resets the lottery, and sends money", async function () {
                  const accounts = await ethers.getSigners();
                  const additionalEntrants = 3;
                  const startingAccountIndex = 1;
                  for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
                      const accountConnectedRaffle = raffle.connect(accounts[i]);
                      //   console.log(accounts[i].address);
                      await accountConnectedRaffle.enterRaffle({
                          value: raffleEntranceFee,
                      });
                  }

                  const startingTimeStamp = await raffle.getLastTimeStamp();

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          try {
                              const recentWinner = await raffle.getRecentWinner();
                              const winnerBalance = await accounts[1].getBalance();
                              const endingTimeStamp = await raffle.getLastTimeStamp();
                              const raffleState = await raffle.getRaffleState();
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(raffleState.toString(), "0");
                              assert(endingTimeStamp > startingTimeStamp);
                              assert.equal(recentWinner.toString(), accounts[1].address);
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                      .add(raffleEntranceFee.mul(additionalEntrants).add(raffleEntranceFee))
                                      .toString()
                              );
                              resolve();
                          } catch (e) {
                              reject();
                          }
                      });

                      const tx = await raffle.performUpkeep([]);
                      const txReceipt = await tx.wait(1);
                      const startingBalance = await accounts[1].getBalance();
                      await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffle.address);
                  });
              });
          });
      });
