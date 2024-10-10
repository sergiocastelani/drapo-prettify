import {Prettifier} from './services/Prettifier'
import {Compressor} from './services/Compressor'
import './App.css'

function prettify()
{
  const compactCode = (document.getElementsByName("originalCode")[0] as HTMLInputElement)?.value ?? "";
  const prettifier = new Prettifier();
  const result = prettifier.parse(compactCode);
  const textarea = document.getElementsByName("prettyCode")[0] as HTMLTextAreaElement;
  if (textarea) 
    textarea.value = result;
}

function compress()
{
  const textarea = document.getElementsByName("prettyCode")[0] as HTMLTextAreaElement;
  if (!textarea) 
    return;
  const compactCodeElement = document.getElementsByName("originalCode")[0] as HTMLInputElement;
  if (!compactCodeElement)
    return;
  compactCodeElement.value = Compressor.compress(textarea.value);
}

function App()
{
  return (
    <div id="App">
      <h1>Original Drapo Code</h1>
      <input type="text" name="originalCode" className='originalCode'/>
      <div className="buttonsRow">
        <button onClick={() => prettify()}>Prettify ⬇</button>
        <button onClick={() => compress()}>Compress ⬆</button>
      </div>
      <h1>Prettified</h1>
      <textarea name="prettyCode" className="prettyCode" rows={40} wrap="off"/>
    </div>
  )
}

export default App
