import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { connect } from 'http2'
import { json } from 'stream/consumers'

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

  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts && accounts[0])
        {
          setConnected(true)
          setAddress(accounts[0].address)
          checkPassport(accounts[0].address)
        }
      } catch (err) {
        console.log("not connected")
      }
    }
  }, [])

  async function connect () {
    try {
      const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
      setAddress(accounts[0])
      setConnected(true)
      checkPassport(accounts[0])
    } catch (err) {
      console.log("error connecting to your account...")
    }
  }

  async function checkPassport(currentAddress = address) {
    setScore('')
    setNoScoreMessage('')

    const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/${currentAddress}`
    try {
      const response = await fetch(GET_PASSPORT_SCORE_URI, {
        headers
      })
      const passportData = await response.json()
      if (passportData.score) {
        const roundedScore = Math.round(passportData*100)/100
        setScore(roundedScore.toString())
      } else {
        console.log("No score available, please add stamps to your passport and then resubmit.")
        setNoScoreMessage("No score available, please submit your passport after you've added stamps.")
      }
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function getSigningMessage() {
    try {
      const response = await fetch(SIGNING_MESSAGE_URI, {
        headers
      })
      const json = await response.json()
      return json
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async function submitPassport() {
    setNoScoreMessage('')
    try {
      // call the api to get the signing message and the nonce
      const {message, nonce} = await getSigningMessage()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      // ask the user to sign the message
      const signature = await signer.signMessage(message)

      // call the api to get the signing message, the signature, and the nonce
      const response = await fetch(SUBMIT_PASSPORT_URI, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address,
          scorer_id: SCORER_ID,
          signature,
          nonce
        })
      })
      const data = await response.json()
      console.log('data:', data)
    } catch (err) {
      console.log('error: ', err)
    }
  }

  return (
    // define the UI of the app
    <div style={styles.main}>
      <h1 style={styles.header}>Gitcoin passport scorer</h1>
      <p style={styles.configurePassport}>Configure your passport <a style={styles.linkStyle} target="_blank" href="https://passport.gitcoin.co/#/dashboard">here</a></p>
      <p style={styles.configurePassport}>Submit passport again to recalculate score.</p>

      <div style={styles.buttonContainer}>
        {
          !connected && (
            <button style={styles.buttonStyle} onClick={connect}>Connect your wallet</button>
          )
        }
        {
          score && (
            <div>
              <h1>Your Gitcoin passport score is {score}</h1>
              <div style={styles.hiddenMessageContainer}>
                {
                  Number(score) >= THRESHOLD_NUMBER && (
                    <h2>Congratulations, you now have access to the secret message!</h2>
                  )
                }
                {
                  Number(score) < THRESHOLD_NUMBER && (
                    <h2>Sorry, your score does not pass the eligibility to access the secret message.</h2>
                  )
                }
                {
                  connected && (
                    <div>
                      <button style={styles.buttonContainer} onClick={submitPassport}>Submit passport</button>
                      <button style={styles.buttonContainer} onClick={() => checkPassport()}>Check passport score</button>
                    </div>
                  )
                }
                {
                  noScoreMessage && (
                    <p style={styles.noScoreMessage}>{noScoreMessage}</p>
                  )
                }
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

const styles = {
  main: {
    width: '900px',
    margin: '0 auto',
    paddingTop: 90
  },
  heading: {
    fontSize: 60
  },
  intro: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, .55)'
  },
  configurePassport: {
    marginTop: 20,
  },
  linkStyle: {
    color: '#008aff'
  },
  buttonContainer: {
    marginTop: 20
  },
  buttonStyle: {
    padding: '10px 30px',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    borderBottom: '2px solid rgba(0, 0, 0, .2)',
    borderRight: '2px solid rgba(0, 0, 0, .2)'
  },
  hiddenMessageContainer: {
    marginTop: 15
  },
  noScoreMessage: {
    marginTop: 20
  }

}