import { ethers } from "@nomiclabs/buidler"
import chai, { expect } from "chai"
import { solidity } from "ethereum-waffle"
import { BigNumber } from "ethers/utils"

import { Counter } from "../typechain/Counter"
import { CounterFactory } from "../typechain/CounterFactory"

chai.use(solidity)

describe("Counter", () => {
  let counter: Counter
  let count: BigNumber

  beforeEach(async () => {
    const [deployer] = await ethers.signers()
    counter = await new CounterFactory(deployer).deploy()
  })

  describe("constructor", async () => {
    it("should be properly deployed", async () => {
      expect(counter.address).to.be.properAddress
    })

    it("initially should count 0", async () => {
      const initialCount = await counter.getCount()
      expect(initialCount).to.equal(0)
    })
  })

  describe("countUp", async () => {
    it("should count up properly", async () => {
      await counter.countUp()
      count = await counter.getCount()
      expect(count).to.equal(1)
    })
  })

  describe("countDown", async () => {
    it("should fail on underflow", async () => {
      await expect(counter.countDown()).to.be.reverted
    })

    it("should count down properly", async () => {
      await counter.countUp()
      await counter.countDown()
      count = await counter.getCount()
      expect(count).to.equal(0)
    })
  })
})
