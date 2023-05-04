import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { connect } from 'http2'

// add the api key and the scorer id from the .env.local file
const APIKEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

// endpoint for submitting passport
const SUBMIT_PASSPORT_URI = ''
// endpoint for signing a message
const SIGNING_MESSAGE_URI = ''
// set a threshold score to access the hidden message
const THRESHOLD_NUMBER = 20

// add header information to the request
const headers = APIKEY ? ({
  'content-type': 'application/json',
  'X-API-KEY': APIKEY
}) : undefined

// declare the ethers instance to interact with the wallet
declare global {
  interface Window {
    ethereum? : any
  }
}

export default function Passport() {
  // create local state variables
  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false)
  const [score, setScore] = useState<string>('')
  const [noScoreMessage, setNoScoreMessage] = useState<string>('')

  return (
    // define the UI of the app
    <div style={StyleSheet.main}>
      <h1 style={styles.header}>Gitcoin passport scorer</h1>
      <p style={styles.configurePassport}>Configure your passport <a style={styles.linkStyle} target="_blank" href="https://passport.gitcoin.co/#/dashboard">here</a></p>
      <p style={styles.configurePassport}>Submit passport again to recalculate score.</p>

      <div style={styles.buttonContainer}>
        {
          !connected && (
            <button style={styles.buttonStyle} onClick={connect}>Connect your wallet</button>
          )
        }
      </div>
    </div>
  )
}