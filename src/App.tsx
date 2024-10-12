import {Prettifier} from './services/Prettifier'
import {Compressor} from './services/Compressor'
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useEffect, useState } from 'react';
import './App.css'
import './assets/custom_highlights.css'

function App()
{
  const [code, setCode] = useState("");

  function prettify()
  {
    const compactCode = (document.getElementsByName("originalCode")[0] as HTMLInputElement)?.value ?? "";
    const prettifier = new Prettifier();
    const result = prettifier.parse(compactCode);
    setCode(result);
  }
  
  function compress()
  {
    const compactCodeElement = document.getElementsByName("originalCode")[0] as HTMLInputElement;
    if (!compactCodeElement)
      return;
    compactCodeElement.value = Compressor.compress(code);
  }
  
  useEffect(() => {
    setTimeout(() => {
        const ponctuationElements = document.getElementsByClassName("token punctuation");
        for (let i=0; i < ponctuationElements.length; ++i)
        {
          const element = ponctuationElements[i];
          const content = element.innerHTML;
          switch (content)
          {
            case "{": case "}": element.classList.add("brackets"); break;
            case "(": case ")": element.classList.add("parentheses"); break;
          }
        }
      }
      ,0);
  }, [code]);

  return (
    <div id="App">
      <h1>Original Drapo Code</h1>
      <input type="text" name="originalCode" className='originalCode'/>
      <div className="buttonsRow">
        <button onClick={() => prettify()}>Prettify ⬇</button>
        <button onClick={() => compress()}>Compress ⬆</button>
      </div>

      <h1>Prettified</h1>
      <CodeEditor
        data-color-mode="dark"
        value={code}
        language="js"
        placeholder=""
        onChange={(evn) => setCode(evn.target.value)}
        padding={15}
        style={{
          fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          fontSize: "14px"
        }}
      />

    </div>
  )
}

export default App
