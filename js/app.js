// URLs for testing varius scenarios:
// success: doc.html#e4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1a
// success and expired: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11
// error: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1 // FIXME: show error message
// fail: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1f

const loadElement = document.querySelector('.load')
const successfulElement = document.querySelector('.successful')
const failedElement = document.querySelector('.failed')

// const network = "rinkeby";
const network = "matic";

let provider;

if (network === "matic") {
  provider = ethers.getDefaultProvider({
    name: 'matic',
    chainId: 137,
    _defaultProvider: (providers) => new providers.JsonRpcProvider('https://rpc-mainnet.maticvigil.com')
  });
} else if (network === "rinkeby") {
  provider = new ethers.providers.InfuraProvider(network);
}

const contractConfig = {
  rinkeby: {
    address: "0xc21a357b32df6f220c4d756e3755753632f35b4f",
    txUrlBase: "https://rinkeby.etherscan.io/tx/"
  },
  matic: {
    address: "0xb370fc5ac2846243686ff324b89c85086b453bdf",
    txUrlBase: "https://polygonscan.com/tx/"
  },
  abi: [
    "function docHashTime(bytes32 _docHash) view returns (uint256)",
    "function newVersions(bytes32 _docHash) view returns (bytes32)",
    "function docHashTx(bytes32 _docHash) view returns (bytes32)"
  ],
};
const contract = new ethers.Contract(contractConfig[network].address, contractConfig.abi, provider);

async function validate() {
  showLoad()

  try {
    await contract.deployed();

    let docHash = location.hash.replace("#", "")

    docHash = "0x" + docHash.replace("0x", "")

    let txHash = await contract.docHashTx(docHash);
    let txExist = Number(txHash) > 0

    if (txExist) {
      let txn = await provider.getTransaction(txHash)
      let blockHash = txn.blockHash
      let block = await provider.getBlock(blockHash)
      let newVersionHash = await contract.newVersions(docHash);
      let hasNewVersion = Number(newVersionHash) > 0

      showSuccessful()

      let txHashElement = document.getElementById("tx-hash");
      txHashElement.innerHTML = `<a class="hash-link" href="${contractConfig[network].txUrlBase + txHash}" target="_blank">${txHash}</a>`

      let timeElement = document.getElementById("timestamp");
      timeElement.innerText = new Date(block.timestamp * 1000)

      const text = document.querySelector('.info__text_time')
      text.textContent = new Date(block.timestamp * 1000)

      let blockHashElement = document.getElementById("block-hash");
      blockHashElement.innerText = blockHash

      let docHashElement = document.getElementById("doc-hash");
      docHashElement.innerText = docHash

      if (hasNewVersion) {
        // change color of central text block to pink instead green
        showSuccessful()
        const textBlock = document.querySelector('.information')
        textBlock.style.background = '#ffb9bc'
      }
    } else {
      showFailed()
    }
  } catch (e) {
    console.log(e)
    showFailed() // TODO: showError()
  }
}
validate();

window.onhashchange = function() {
  validate();
}

function showSuccessful() {
  successfulElement.style.display = 'block'
  loadElement.style.display = 'none'
  failedElement.style.display = 'none'
}

function showFailed() {
  failedElement.style.display = 'block'
  loadElement.style.display = 'none'
  successfulElement.style.display = 'none'
}

function showLoad() {
  loadElement.style.display = 'block'
  failedElement.style.display = 'none'
  successfulElement.style.display = 'none'
}