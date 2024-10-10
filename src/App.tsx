import './App.css'

function App() {

  return (
    <div id="App">
      <h1>Original Drapo Expression</h1>
      <input type="text" name="originalDrapoExpression" className='originalExpression'/>
      <div className="buttonsRow">
        <button>Prettify ⬇</button>
        <button>Compress ⬆</button>
      </div>
      <h1>Prettified</h1>
      <textarea name="prettyDrapoExpression" className="prettyExpression" rows={35}/>
    </div>
  )
}

export default App
