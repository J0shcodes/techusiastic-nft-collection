import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { Contract, providers, utils } from "ethers";
import Web3Modal, { Provider } from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

  const web3ModalRef = useRef();

  // Presale Mint: Mint an NFT during presale

  const presaleMint = async () => {
    try {
      const signer = await getProvider(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const transaction = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await transaction.wait();
      setLoading(false);
      window.alert("You successfully minted a Techusiastic NFT!");
    } catch (error) {
      console.error(error);
    }
  };

  // Public Mint: Mint an NFT after presale

  const publicMint = async () => {
    try {
      const signer = await getProvider(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const transaction = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await transaction.wait();
      setLoading(false);

      window.alert("You have successfully minted a Techusiastic NFT");
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProvider();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const startPresale = async () => {
    try {
      const signer = await getProvider(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const transaction = await nftContract.startPresale();
      setLoading(true);
      await transaction.wait();
      setLoading(false);

      checkIfPresaleStarted();
    } catch (error) {}
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProvider();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProvider();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _presaleEnded = await nftContract.presaleEnded();

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }

      return hasEnded;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProvider();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _owner = await nftContract.owner();

      const signer = await getProvider(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase());
      setIsOwner(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProvider();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const _tokenIds = await nftContract.tokenIds();

      setTokenIdsMinted(_tokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getProvider = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();

    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "Rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
    connectWallet();

    const _presaleStarted = checkIfPresaleStarted();
    if (_presaleStarted) {
      checkIfPresaleEnded();
    }

    getTokenIdsMinted();

    const presaleEndedInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

    setInterval(async function () {
      await getTokenIdsMinted();
    }, 5 * 1000);
  }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Your Wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale !
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn't started!</div>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div className={styles.presaleDescription}>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to <span className={styles.techusiastic}>Techusiastics</span>!</h1>
          <div className={styles.description}>
            Its an NFT collection for tech enthusiasts and developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by <a href='https://github.com/J0shcodes'>J0shcodes</a></footer>
    </div>
  );
}
