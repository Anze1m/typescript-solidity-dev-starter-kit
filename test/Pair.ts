import { ethers } from '@nomiclabs/buidler'
import { expect } from 'chai'
import { Signer } from 'ethers'

import { Pair } from '../typechain/Pair'
import { PairFactory } from '../typechain/PairFactory'
import { Token } from '../typechain/Token'
import { TokenFactory } from '../typechain/TokenFactory'


describe('Pair', () => {
    let pair: Pair
    let apeAsset: Token    
    let catCoin: Token

    let deployer: Signer

    beforeEach(async () => {
        [deployer] = await ethers.getSigners()
        const pairFactory = new PairFactory(deployer)
        const tokenFactory = new TokenFactory(deployer)

        apeAsset = await tokenFactory.deploy()        
        catCoin = await tokenFactory.deploy()    
        pair = await pairFactory.deploy(apeAsset.address, catCoin.address)
    })

    describe('constructor', () => {
        it('sets asset pointers properly', async () => {
            expect(await pair.xToken()).to.equal(apeAsset.address)
            expect(await pair.yToken()).to.equal(catCoin.address)
        })
    })      

    describe('fuel', () => {
        beforeEach(async () => {
            await apeAsset.approve(pair.address, 1000)
            await catCoin.approve(pair.address, 1000)
        })

        it('should fuel contract with tokens', async () => {
            await pair.fuel(500, 500)
            expect(await apeAsset.balanceOf(pair.address)).to.equal(500)
            expect(await catCoin.balanceOf(pair.address)).to.equal(500)
        })

        it('should fuel contract with tokens when called multiple times', async () => {
            await pair.fuel(200, 100)
            await pair.fuel(400, 200)
            expect(await apeAsset.balanceOf(pair.address)).to.equal(600)
            expect(await catCoin.balanceOf(pair.address)).to.equal(300)
        })
        
        it('should transfer funds from tokens donor')

        it('should revert when fueling violates price', async () => {
            await pair.fuel(200, 100)
            await expect(pair.fuel(50, 200)).to.be.revertedWith("fueling should not change price")
        })

        it('should emit a proper event', async () => {
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

            apeAsset.transfer(traderAddress, 100)
            await apeAsset.connect(trader).approve(pair.address, 100)

            await apeAsset.approve(pair.address, 1000)
            await catCoin.approve(pair.address, 1000)
            await pair.fuel(500, 500)
        })
        
        it('properly moves sold asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await apeAsset.balanceOf(traderAddress)).to.equal(50)
            expect(await apeAsset.balanceOf(pair.address)).to.equal(550)
        })
        
        it('properly moves bought asset', async () => {
            await pair.connect(trader).swap(50)
            expect(await catCoin.balanceOf(traderAddress)).to.be.above(0)
            expect(await catCoin.balanceOf(pair.address)).to.be.below(500)
        })

        it('should emit a proper event', async () => {
            await expect(pair.connect(trader).swap(50))
                .to.emit(pair, 'Swap')
        })
    })
})