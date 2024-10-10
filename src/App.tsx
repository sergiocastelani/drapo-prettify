import './App.css'

function App() {

  return (
    <div id="App">
      <h1>Original Drapo Code</h1>
      <input type="text" name="originalCode" className='originalCode'/>
      <div className="buttonsRow">
        <button onClick={() => console.log((document.getElementsByName("originalCode")[0] as HTMLInputElement)?.value)}>Prettify ⬇</button>
        <button>Compress ⬆</button>
      </div>
      <h1>Prettified</h1>
      <textarea name="prettyCode" className="prettyCode" rows={40}/>
    </div>
  )
}

export default App
