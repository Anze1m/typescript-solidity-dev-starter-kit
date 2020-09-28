import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import { Signer } from 'ethers'

import { Market } from '../typechain/Market'
import { MarketFactory } from '../typechain/MarketFactory'
import { Token } from '../typechain/Token'
import { TokenFactory } from '../typechain/TokenFactory'


describe('Market', () => {
    let market: Market
    let kiwis: Token
    let plums: Token

    let deployer: Signer

    beforeEach(async () => {
        [deployer] = await ethers.getSigners()
        const marketFactory = new MarketFactory(deployer)
        const tokenFactory = new TokenFactory(deployer)

        kiwis = await tokenFactory.deploy()        
        plums = await tokenFactory.deploy()    
        market = await marketFactory.deploy(kiwis.address, plums.address)
    })

    it('properly constructs', async () => {
        expect(await market.xToken()).to.equal(kiwis.address)
        expect(await market.yToken()).to.equal(plums.address)
    })

    describe('supply', () => {
        beforeEach(async () => {
            await kiwis.approve(market.address, 1000)
            await plums.approve(market.address, 1000)
        })

        it('passes once', async () => {
            await market.supply(500, 500)
            expect(await kiwis.balanceOf(market.address)).to.equal(500)
            expect(await plums.balanceOf(market.address)).to.equal(500)
        })

        it('passes twice', async () => {
            await market.supply(200, 100)
            await market.supply(400, 200)
            expect(await kiwis.balanceOf(market.address)).to.equal(600)
            expect(await plums.balanceOf(market.address)).to.equal(300)
        })

        it('transfers funds from donor')

        it('reverts on 0 xTokens', async () => {
            await expect(market.supply(0, 200)).to.be.revertedWith("input = 0")
        })

        it('reverts on 0 yTokens', async () => {
            await expect(market.supply(1000, 0)).to.be.revertedWith("input = 0")
        })

        it('reverts when not preserving ratio', async () => {
            await market.supply(200, 100)
            await expect(market.supply(50, 200)).to.be.revertedWith("price changed")
        })

        it('emits proper event', async () => {
            await expect(market.supply(200, 300))
                .to.emit(market, 'Supply').withArgs(200, 300)
        })
    })

    describe('trade', () => {
        let trader: Signer
        let traderAddress: string

        beforeEach(async () => {
            [, trader] = await ethers.getSigners()
            traderAddress = await trader.getAddress()

            kiwis.transfer(traderAddress, 100)
            await kiwis.connect(trader).approve(market.address, 100)

            await kiwis.approve(market.address, 1000)
            await plums.approve(market.address, 1000)
            await market.supply(500, 500)
        })
        
        it('transfers sold asset', async () => {
            await market.connect(trader).trade(50)
            expect(await kiwis.balanceOf(traderAddress)).to.equal(50)
            expect(await kiwis.balanceOf(market.address)).to.equal(550)
        })
        
        it('transfers bought asset', async () => {
            await market.connect(trader).trade(50)
            expect(await plums.balanceOf(traderAddress)).to.be.above(0)
            expect(await plums.balanceOf(market.address)).to.be.below(500)
        })

        it('reverts on 0', async () => {
            await expect(market.connect(trader).trade(0)).to.be.revertedWith("input = 0")
        })

        it('emits proper event', async () => {
            await expect(market.connect(trader).trade(50))
                .to.emit(market, 'Trade')
        })
    })
})