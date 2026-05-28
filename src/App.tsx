import {Prettifier} from './services/Prettifier'
import {Compressor} from './services/Compressor'
import CodeEditor from '@uiw/react-textarea-code-editor';
import { useEffect, useState, type DragEvent } from 'react';
import './App.css'
import './assets/custom_highlights.css'

type WorkspaceTab = {
  id: number;
  title: string;
  originalCode: string;
  prettyCode: string;
};

type TabDropTarget = {
  tabId: number;
  placeAfter: boolean;
};

function getTabTitleBase(title: string): string
{
  return title.replace(/\s\(\d+\)$/, '');
}

function escapeRegex(value: string): string
{
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTabTitleNumber(title: string, baseTitle: string): number | null
{
  if (title === baseTitle)
    return 1;

  const match = title.match(new RegExp(`^${escapeRegex(baseTitle)} \\((\\d+)\\)$`));
  return match ? Number(match[1]) : null;
}

function createDuplicateTabTitle(tabs: WorkspaceTab[], title: string): string
{
  const baseTitle = getTabTitleBase(title);
  const maxTabNumber = tabs.reduce((maxNumber, tab) => {
    if (getTabTitleBase(tab.title) !== baseTitle)
      return maxNumber;

    const tabNumber = getTabTitleNumber(tab.title, baseTitle);
    if (tabNumber === null)
      return maxNumber;

    return Math.max(maxNumber, tabNumber);
  }, 0);

  return `${baseTitle} (${maxTabNumber + 1})`;
}

function createWorkspaceTab(id: number): WorkspaceTab
{
  return {
    id,
    title: `Tab ${id}`,
    originalCode: '',
    prettyCode: '',
  };
}

function reorderTabs(tabs: WorkspaceTab[], draggedTabId: number, targetTabId: number, placeAfter: boolean): WorkspaceTab[]
{
  if (draggedTabId === targetTabId)
    return tabs;

  const draggedTab = tabs.find((tab) => tab.id === draggedTabId);
  if (!draggedTab)
    return tabs;

  const remainingTabs = tabs.filter((tab) => tab.id !== draggedTabId);
  const targetIndex = remainingTabs.findIndex((tab) => tab.id === targetTabId);
  if (targetIndex < 0)
    return tabs;

  const insertionIndex = placeAfter ? targetIndex + 1 : targetIndex;
  return [
    ...remainingTabs.slice(0, insertionIndex),
    draggedTab,
    ...remainingTabs.slice(insertionIndex),
  ];
}

function App()
{
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => [createWorkspaceTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);
  const [draggedTabId, setDraggedTabId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<TabDropTarget | null>(null);

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

  async function copyOriginalCodeToClipboard()
  {
    await navigator.clipboard.writeText(activeTab.originalCode);
  }

  async function pasteOriginalCodeFromClipboard()
  {
    const clipboardText = await navigator.clipboard.readText();
    updateActiveTab((tab) => ({ ...tab, originalCode: clipboardText }));
  }

  function addTab()
  {
    const newTab = createWorkspaceTab(nextTabId);
    setTabs((currentTabs) => [...currentTabs, newTab]);
    setActiveTabId(newTab.id);
    setNextTabId((currentId) => currentId + 1);
  }

  function duplicateTab()
  {
    const newTab = {
      ...createWorkspaceTab(nextTabId),
      title: createDuplicateTabTitle(tabs, activeTab.title),
      originalCode: activeTab.originalCode,
      prettyCode: activeTab.prettyCode,
    };
    setTabs((currentTabs) => [...currentTabs, newTab]);
    setActiveTabId(newTab.id);
    setNextTabId((currentId) => currentId + 1);
  }

  function closeTab(tabId: number)
  {
    const closingTabIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (closingTabIndex < 0)
      return;

    const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
    if (remainingTabs.length === 0)
    {
      const replacementTab = createWorkspaceTab(nextTabId);
      setTabs([replacementTab]);
      setActiveTabId(replacementTab.id);
      setNextTabId((currentId) => currentId + 1);
      return;
    }

    setTabs(remainingTabs);
    if (activeTabId !== tabId)
      return;

    const nextActiveTab = remainingTabs[Math.min(closingTabIndex, remainingTabs.length - 1)];
    setActiveTabId(nextActiveTab.id);
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

  function getDropTarget(event: DragEvent<HTMLDivElement>, tabId: number): TabDropTarget
  {
    const bounds = event.currentTarget.getBoundingClientRect();
    const midpoint = bounds.left + bounds.width / 2;
    return {
      tabId,
      placeAfter: event.clientX >= midpoint,
    };
  }

  function handleTabDragStart(tabId: number)
  {
    setDraggedTabId(tabId);
    setDropTarget(null);
  }

  function handleTabDragOver(event: DragEvent<HTMLDivElement>, tabId: number)
  {
    event.preventDefault();
    if (draggedTabId === null || draggedTabId === tabId)
    {
      setDropTarget(null);
      return;
    }

    setDropTarget(getDropTarget(event, tabId));
  }

  function handleTabDrop(event: DragEvent<HTMLDivElement>, tabId: number)
  {
    event.preventDefault();
    if (draggedTabId === null)
      return;

    const nextDropTarget = getDropTarget(event, tabId);
    setTabs((currentTabs) => reorderTabs(currentTabs, draggedTabId, nextDropTarget.tabId, nextDropTarget.placeAfter));
    setDraggedTabId(null);
    setDropTarget(null);
  }

  function clearDragState()
  {
    setDraggedTabId(null);
    setDropTarget(null);
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
      <div
        className="tabsList"
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => clearDragState()}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tabItem${tab.id === activeTab.id ? ' tabItemActive' : ''}${tab.id === draggedTabId ? ' tabItemDragging' : ''}${dropTarget?.tabId === tab.id ? (dropTarget.placeAfter ? ' tabItemDropAfter' : ' tabItemDropBefore') : ''}`}
            draggable
            onDragStart={() => handleTabDragStart(tab.id)}
            onDragOver={(event) => handleTabDragOver(event, tab.id)}
            onDrop={(event) => handleTabDrop(event, tab.id)}
            onDragEnd={() => clearDragState()}
          >
            <button
              type="button"
              className={`tabButton${tab.id === activeTab.id ? ' tabButtonActive' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  renameTab(tab.id);
                }}
                title="Drag to reorder, right-click to rename"
              >
                {tab.title}
              </button>
              <button
                type="button"
                className="tabCloseButton"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`Close ${tab.title}`}
                title={`Close ${tab.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="tabsActions">
          <button type="button" className="tabAddButton" onClick={() => duplicateTab()}>
            Duplicate
          </button>
          <button type="button" className="tabAddButton" onClick={() => addTab()}>
            + New Tab
          </button>
        </div>
      </div>

      <div className="workspace">
        <h1>Original Drapo Code</h1>
      <div className="originalCodeRow">
        <input
          type="text"
          name="originalCode"
          className='originalCode'
          value={activeTab.originalCode}
          onChange={(event) => updateActiveTab((tab) => ({ ...tab, originalCode: event.target.value }))}
        />
        <div className="originalCodeActions">
          <button
            type="button"
            className="iconButton"
            onClick={() => void copyOriginalCodeToClipboard()}
            aria-label="Copy original code"
            title="Copy original code"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 9h11v11H9z" />
              <path d="M4 4h11v3H7v8H4z" />
            </svg>
          </button>
          <button
            type="button"
            className="iconButton"
            onClick={() => void pasteOriginalCodeFromClipboard()}
            aria-label="Paste original code"
            title="Paste original code"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 3h6l1 2h3v16H5V5h3z" />
              <path d="M12 8v7" />
              <path d="M9.5 12.5 12 15l2.5-2.5" />
            </svg>
          </button>
        </div>
      </div>
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
