import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import { Signer } from 'ethers'

import { Pair } from '../typechain/Pair'
import { PairFactory } from '../typechain/PairFactory'
import { Token } from '../typechain/Token'
import { TokenFactory } from '../typechain/TokenFactory'


describe('Pair', () => {
    let pair: Pair
    let kiwis: Token    
    let plums: Token

    let deployer: Signer

    beforeEach(async () => {
        [deployer] = await ethers.getSigners()
        const pairFactory = new PairFactory(deployer)
        const tokenFactory = new TokenFactory(deployer)

        kiwis = await tokenFactory.deploy()        
        plums = await tokenFactory.deploy()    
        pair = await pairFactory.deploy(kiwis.address, plums.address)
    })

    it('constructor sets token pointers properly', async () => {
        expect(await pair.xToken()).to.equal(kiwis.address)
        expect(await pair.yToken()).to.equal(plums.address)
    })

    describe('fuel', () => {
        beforeEach(async () => {
            await kiwis.approve(pair.address, 1000)
            await plums.approve(pair.address, 1000)
        })

        it('passes once', async () => {
            await pair.fuel(500, 500)
            expect(await kiwis.balanceOf(pair.address)).to.equal(500)
            expect(await plums.balanceOf(pair.address)).to.equal(500)
        })

        it('passes twice', async () => {
            await pair.fuel(200, 100)
            await pair.fuel(400, 200)
            expect(await kiwis.balanceOf(pair.address)).to.equal(600)
            expect(await plums.balanceOf(pair.address)).to.equal(300)
        })

        it('transfers funds from donor')

        it('reverts on 0 xTokens', async () => {
            await expect(pair.fuel(0, 200)).to.be.revertedWith("input = 0")
        })

        it('reverts on 0 yTokens', async () => {
            await expect(pair.fuel(1000, 0)).to.be.revertedWith("input = 0")
        })

        it('reverts when not preserving ratio', async () => {
            await pair.fuel(200, 100)
            await expect(pair.fuel(50, 200)).to.be.revertedWith("price changed")
        })

        it('emits proper event', async () => {
            await expect(pair.fuel(200, 300))
                .to.emit(pair, 'Fuel').withArgs(200, 300)
        })
    })

    describe('swap', () => {
        let trader: Signer
        let traderAddress: string

        beforeEach(async () => {
            [, trader] = await ethers.getSigners()
            traderAddress = await trader.getAddress()

            kiwis.transfer(traderAddress, 100)
            await kiwis.connect(trader).approve(pair.address, 100)

            await kiwis.approve(pair.address, 1000)
            await plums.approve(pair.address, 1000)
            await pair.fuel(500, 500)
        })
        
        it('transfers sold asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await kiwis.balanceOf(traderAddress)).to.equal(50)
            expect(await kiwis.balanceOf(pair.address)).to.equal(550)
        })
        
        it('transfers bought asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await plums.balanceOf(traderAddress)).to.be.above(0)
            expect(await plums.balanceOf(pair.address)).to.be.below(500)
        })

        it('reverts on 0', async () => {
            await expect(pair.connect(trader).swap(0)).to.be.revertedWith("input = 0")
        })

        it('emits proper event', async () => {
            await expect(pair.connect(trader).swap(50))
                .to.emit(pair, 'Swap')
        })
    })
})