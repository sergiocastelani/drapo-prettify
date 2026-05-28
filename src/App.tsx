import {Prettifier} from './services/Prettifier'
import {Compressor} from './services/Compressor'
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useEffect, useState } from 'react';
import './App.css'
import './assets/custom_highlights.css'

type WorkspaceTab = {
  id: number;
  title: string;
  originalCode: string;
  prettyCode: string;
};

function createWorkspaceTab(id: number): WorkspaceTab
{
  return {
    id,
    title: `Tab ${id}`,
    originalCode: '',
    prettyCode: '',
  };
}

function App()
{
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => [createWorkspaceTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  function updateActiveTab(update: (tab: WorkspaceTab) => WorkspaceTab)
  {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => tab.id === activeTabId ? update(tab) : tab)
    );
  }

  function prettify()
  {
    const prettifier = new Prettifier();
    const result = prettifier.parse(activeTab.originalCode);
    updateActiveTab((tab) => ({ ...tab, prettyCode: result }));
  }
  
  function compress()
  {
    const compressedCode = Compressor.compress(activeTab.prettyCode);
    updateActiveTab((tab) => ({ ...tab, originalCode: compressedCode }));
  }

  function addTab()
  {
    const newTab = createWorkspaceTab(nextTabId);
    setTabs((currentTabs) => [...currentTabs, newTab]);
    setActiveTabId(newTab.id);
    setNextTabId((currentId) => currentId + 1);
  }

  function renameTab(tabId: number)
  {
    const currentTab = tabs.find((tab) => tab.id === tabId);
    if (!currentTab)
      return;

    const nextTitleInput = window.prompt('Rename tab', currentTab.title);
    if (nextTitleInput === null)
      return;

    const nextTitle = nextTitleInput.trim() || `Tab ${tabId}`;
    setTabs((currentTabs) =>
      currentTabs.map((tab) => tab.id === tabId ? { ...tab, title: nextTitle } : tab)
    );
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
  }, [activeTab.prettyCode]);

  return (
    <div id="App">
      <div className="tabsBar">
        <div className="tabsList">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tabButton${tab.id === activeTab.id ? ' tabButtonActive' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                renameTab(tab.id);
              }}
              title="Right-click to rename"
            >
              {tab.title}
            </button>
          ))}
        </div>
        <button type="button" className="tabAddButton" onClick={() => addTab()}>
          + New Tab
        </button>
      </div>

      <div className="workspace">
        <h1>Original Drapo Code</h1>
        <input
          type="text"
          name="originalCode"
          className='originalCode'
          value={activeTab.originalCode}
          onChange={(event) => updateActiveTab((tab) => ({ ...tab, originalCode: event.target.value }))}
        />
        <div className="buttonsRow">
          <button onClick={() => prettify()}>Prettify ⬇</button>
          <button onClick={() => compress()}>Compress ⬆</button>
        </div>

        <h1>Prettified</h1>
        <div className="editorPanel">
          <CodeEditor
            className="prettyCodeEditor"
            data-color-mode="dark"
            value={activeTab.prettyCode}
            language="js"
            placeholder=""
            onChange={(event) => updateActiveTab((tab) => ({ ...tab, prettyCode: event.target.value }))}
            padding={15}
            style={{
              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
              fontSize: "14px",
              height: '100%',
              minHeight: '100%',
            }}
          />
        </div>
      </div>

    </div>
  )
}

export default App
