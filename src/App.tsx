import { useState } from "react";

type Item = {
  str: string
}

export default function App() {
  const [code, setCode] = useState("");

  function readFileAsync(file: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPdfText = async (pdfArrayBuffer: any) => {
    const pdfJS = await import("pdfjs-dist");

    pdfJS.GlobalWorkerOptions.workerSrc =
      window.location.origin + "/pdf.worker.min.mjs";

    // const pdf = await pdfJS.getDocument("/test.pdf").promise;
    const pdf = await pdfJS.getDocument(pdfArrayBuffer).promise;

    pdf.getPage(1).then((page) => {
      page.getTextContent().then((textContent) => {
        const array: string[] = [];
        const items = textContent.items as Item[]
        items.forEach((item) => {
          const itemText = item.str.trim();
          if (itemText) {
            array.push(itemText);
          }
        });
        const personalIndex = array.indexOf("Recipient Information");
        const firstWord = array[personalIndex + 2].split(" ")[0];
        if (isNaN(firstWord as unknown as number)) {
          array.splice(personalIndex + 2, 1);
        }
        const name = array[personalIndex + 1];
        const address = array[personalIndex + 2];
        const city = array[personalIndex + 3];
        const state = array[personalIndex + 5];
        const zip = array[personalIndex + 6];
        const phoneIndex = array.indexOf("Phone");
        let phone = array[phoneIndex + 2];

        const extIndex = phone.indexOf("EXT");
        let ext = "";
        if (extIndex > 1) {
          const extText = phone.substring(extIndex);
          const extNumberIndex = extText.indexOf(":");
          ext = extText.substring(extNumberIndex + 2);
          phone = phone.replace(extText, "").trim();
        }

        // const productIndex = array.indexOf("First Choice");
        // const product = array[productIndex + 2];

        const messageInitialIndex = array.indexOf("Card Message");
        const messageFinalIndex = array.indexOf("Special Instructions");
        let message = "";
        for (
          let index = messageInitialIndex + 2;
          index < messageFinalIndex;
          index++
        ) {
          message += `${array[index]} `;
        }

        const choiceInitialIndex = array.indexOf("First Choice");
        const choiceFinalIndex = array.indexOf("Second Choice");
        let product = "";
        for (
          let index = choiceInitialIndex + 2;
          index < choiceFinalIndex;
          index++
        ) {
          product += `${array[index]} `;
        }

        const code = `document.getElementById('reciFirstName').value = '${name}';
document.getElementById('reciAddress1').value = '${address}';
document.getElementById('reciZipCode').value = '${zip}';
document.getElementById('reciCity').value = '${city}';
document.getElementById('reciState').value = '${state}';
document.getElementById('reciPhone1').value = '${phone}';
document.getElementById('reciPhone1Ext').value = '${ext}';
document.getElementById('orderItemDesc1').value = '${product.trim()}';
document.getElementById('orderCardMsg').value = '${message.trim()}';`;

        setCode(code);
      });
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFileSelected = async (e: { target: { files: any } }) => {
    const fileList = e.target.files;
    if (fileList?.length > 0) {
      const pdfArrayBuffer = await readFileAsync(fileList[0]);
      getPdfText(pdfArrayBuffer);
    }
  };

  const handleClick = () => {
    const copyText = document.getElementById("test");
    if (copyText) {
      navigator.clipboard.writeText(copyText.innerHTML);
    }
  };

  return (
    <>
      <h1>PDF to code</h1>
      <input type="file" accept=".pdf" onChange={onFileSelected} />
      {code && (
        <>
          <br></br>
          <br></br>
          <button className="js-textareacopybtn" onClick={() => handleClick()}>
            Copy Text
          </button>
          <pre id="test">{code}</pre>
        </>
      )}
    </>
  );
}
