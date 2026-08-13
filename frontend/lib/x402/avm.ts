import algosdk from 'algosdk'
import { PeraWalletConnect } from '@perawallet/connect'

export interface PaymentDetails {
  address: string
  amount: number
  asset: number
  note: string
  facilitator: string
  requestId?: string
  expiresAt?: number
  payloadHash?: string
}

export class AVMWalletManager {
  private peraWallet: PeraWalletConnect | null = null
  private walletAddress: string | null = null
  private algodClient: algosdk.Algodv2

  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_ALGORAND_API_URL || 'https://testnet-api.algonode.cloud'
    this.algodClient = new algosdk.Algodv2('', apiUrl, '')
  }

  private getPeraWallet(): PeraWalletConnect {
    if (!this.peraWallet && typeof window !== 'undefined') {
      this.peraWallet = new PeraWalletConnect({
        shouldShowSignTxnToast: true,
      })
    }
    return this.peraWallet!
  }

  async connectPera(): Promise<string> {
    const pera = this.getPeraWallet()
    try {
      const accounts = await pera.connect()
      pera.connector?.on('disconnect', () => {
        this.walletAddress = null
      })
      if (accounts && accounts.length > 0) {
        this.walletAddress = accounts[0]
        return accounts[0]
      }
      throw new Error('No accounts returned from Pera Wallet')
    } catch (err: unknown) {
      const errorObj = err as { data?: { type?: string }; message?: string }
      if (errorObj?.data?.type === 'CONNECT_MODAL_CLOSED' || errorObj?.message?.includes('closed by user')) {
        console.log('Pera Wallet connection modal was closed by user.')
        throw new Error('Wallet connection was closed.')
      }
      console.warn('Pera Wallet connection notice:', errorObj?.message || err)
      throw new Error(errorObj?.message || 'Pera Wallet connection failed')
    }
  }

  async reconnectPera(): Promise<string | null> {
    const pera = this.getPeraWallet()
    try {
      const accounts = await pera.reconnectSession()
      pera.connector?.on('disconnect', () => {
        this.walletAddress = null
      })
      if (accounts && accounts.length > 0) {
        this.walletAddress = accounts[0]
        return accounts[0]
      }
    } catch {
      // Quietly handle session reconnect skip
    }
    return null
  }

  async disconnect(): Promise<void> {
    if (this.peraWallet) {
      try {
        await this.peraWallet.disconnect()
      } catch {
        // Quietly ignore disconnect errors
      }
    }
    this.walletAddress = null
  }

  getConnectedAddress(): string | null {
    return this.walletAddress
  }

  async payUSDC(paymentDetails: PaymentDetails): Promise<string> {
    if (!this.walletAddress) {
      await this.connectPera()
    }

    if (!this.walletAddress) {
      throw new Error('Wallet is not connected')
    }

    const params = await this.algodClient.getTransactionParams().do()

    let txn: algosdk.Transaction

    if (paymentDetails.asset === 0 || !paymentDetails.asset) {
      // Native ALGO Payment (1 ALGO = 1,000,000 microAlgos)
      const amountInMicroAlgos = Math.round(paymentDetails.amount * 1000000)
      txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: this.walletAddress,
        receiver: paymentDetails.address,
        amount: amountInMicroAlgos,
        suggestedParams: params,
        note: new TextEncoder().encode(paymentDetails.note || `Optima AI Payment`),
      })
    } else {
      // ASA Transfer (e.g. USDC ASA)
      const amountInMicroUSDC = Math.round(paymentDetails.amount * 1000000)
      txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: this.walletAddress,
        receiver: paymentDetails.address,
        assetIndex: paymentDetails.asset,
        amount: amountInMicroUSDC,
        suggestedParams: params,
        note: new TextEncoder().encode(paymentDetails.note || `Optima AI Payment`),
      })
    }

    let signedTxns: Uint8Array[]
    try {
      const singleTxnGroup = [{ txn, signers: [this.walletAddress] }]
      const pera = this.getPeraWallet()
      signedTxns = await pera.signTransaction([singleTxnGroup])
    } catch (err: unknown) {
      const errorObj = err as { data?: { type?: string }; message?: string }
      if (
        errorObj?.data?.type === 'SIGN_TXN_CANCELLED' ||
        errorObj?.message?.includes('cancelled') ||
        errorObj?.message?.includes('rejected') ||
        errorObj?.message?.includes('closed')
      ) {
        throw new Error('Payment signing was cancelled by user.')
      }
      throw new Error(errorObj?.message || 'Transaction signing failed.')
    }

    try {
      const sendRes = await this.algodClient.sendRawTransaction(signedTxns).do()
      const txId = sendRes.txid
      await this.waitForConfirmation(txId, 5)
      return txId
    } catch (sendErr: unknown) {
      const errorObj = sendErr as { message?: string }
      throw new Error(`Failed to submit transaction to Algorand: ${errorObj?.message || String(sendErr)}`)
    }
  }

  private async waitForConfirmation(txId: string, timeoutRounds: number = 3): Promise<void> {
    const status = (await this.algodClient.status().do()) as unknown as Record<string, unknown>
    const startRound = Number(status.lastRound || status['last-round'] || 0)
    let currentRound = startRound
    const targetRound = startRound + timeoutRounds

    while (currentRound < targetRound) {
      try {
        const pendingInfo = (await this.algodClient.pendingTransactionInformation(txId).do()) as unknown as Record<string, unknown>
        if (pendingInfo && (pendingInfo.confirmedRound || pendingInfo['confirmed-round'])) {
          return
        }
      } catch {
        // Transaction pending
      }
      await new Promise((res) => setTimeout(res, 1000))
      currentRound += 1
    }
  }
}

export const avmWalletManager = new AVMWalletManager()
