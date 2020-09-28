import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import { Signer } from 'ethers'

import { Pair } from '../typechain/Pair'
import { PairFactory } from '../typechain/PairFactory'
import { Token } from '../typechain/Token'
import { TokenFactory } from '../typechain/TokenFactory'


describe('Pair', () => {
    let pair: Pair
    let antAsset: Token    
    let catCoin: Token

    let deployer: Signer

    beforeEach(async () => {
        [deployer] = await ethers.getSigners()
        const pairFactory = new PairFactory(deployer)
        const tokenFactory = new TokenFactory(deployer)

        antAsset = await tokenFactory.deploy()        
        catCoin = await tokenFactory.deploy()    
        pair = await pairFactory.deploy(antAsset.address, catCoin.address)
    })

    it('constructor sets token pointers properly', async () => {
        expect(await pair.xToken()).to.equal(antAsset.address)
        expect(await pair.yToken()).to.equal(catCoin.address)
    })

    describe('fuel', () => {
        beforeEach(async () => {
            await antAsset.approve(pair.address, 1000)
            await catCoin.approve(pair.address, 1000)
        })
        
        it('passes once', async () => {
            await pair.fuel(500, 500)
            expect(await antAsset.balanceOf(pair.address)).to.equal(500)
            expect(await catCoin.balanceOf(pair.address)).to.equal(500)
        })

        it('passes twice', async () => {
            await pair.fuel(200, 100)
            await pair.fuel(400, 200)
            expect(await antAsset.balanceOf(pair.address)).to.equal(600)
            expect(await catCoin.balanceOf(pair.address)).to.equal(300)
        })

        it('transfers funds from donor')

        it('reverts on 0 xTokens', async () => {
            await expect(pair.fuel(0, 200)).to.be.revertedWith("input amount should not be 0")
        })

        it('reverts on 0 yTokens', async () => {
            await expect(pair.fuel(1000, 0)).to.be.revertedWith("input amount should not be 0")
        })

        it('reverts when not preserving ratio', async () => {
            await pair.fuel(200, 100)
            await expect(pair.fuel(50, 200)).to.be.revertedWith("fueling should not change price")
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

            antAsset.transfer(traderAddress, 100)
            await antAsset.connect(trader).approve(pair.address, 100)

            await antAsset.approve(pair.address, 1000)
            await catCoin.approve(pair.address, 1000)
            await pair.fuel(500, 500)
        })
        
        it('transfers sold asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await antAsset.balanceOf(traderAddress)).to.equal(50)
            expect(await antAsset.balanceOf(pair.address)).to.equal(550)
        })
        
        it('transfers bought asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await catCoin.balanceOf(traderAddress)).to.be.above(0)
            expect(await catCoin.balanceOf(pair.address)).to.be.below(500)
        })

        it('reverts on 0', async () => {
            await expect(pair.connect(trader).swap(0)).to.be.revertedWith("input amount should not be 0")
        })

        it('emits proper event', async () => {
            await expect(pair.connect(trader).swap(50))
                .to.emit(pair, 'Swap')
        })
    })
})