# Drapo Prettifier

A React-based web application for formatting and compressing Drapo code. This tool provides an interactive interface to prettify compact Drapo code with proper indentation and line breaks, as well as compress prettified code back to its compact form.

## Features

- **Code Prettification**: Transforms compact Drapo code into readable, properly indented format
- **Code Compression**: Converts prettified code back to compact, minified form
- **Interactive Interface**: Real-time formatting with syntax highlighting
- **Bidirectional Processing**: Seamlessly switch between prettified and compressed formats
- **Syntax Highlighting**: Enhanced code readability with color-coded syntax

## What is Drapo?

Drapo appears to be a domain-specific language used in business application frameworks. It includes operations like:
- `UpdateSector()` - Updates UI sectors
- `ShowWindow()` - Displays windows/dialogs  
- `IF()` - Conditional statements
- `Execute()` - Function execution
- `PostDataItem()` - Data posting operations
- And many more business logic operations

## Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/sergiocastelani/drapo-prettify.git
   cd drapo-prettify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Web Interface
1. Enter your compact Drapo code in the "Original Drapo Code" input field
2. Click "Prettify ⬇" to format the code with proper indentation and line breaks
3. The formatted code will appear in the syntax-highlighted editor below
4. Edit the prettified code in the editor if needed
5. Click "Compress ⬆" to convert the prettified code back to compact form

### Example

**Input (compact):**
```
IF({{condition}},Execute(action1);ShowWindow(window1),Execute(action2);UpdateSector(sector1))
```

**Output (prettified):**
```
IF(
    {{condition}},
    Execute(action1);
    ShowWindow(window1),
    Execute(action2);
    UpdateSector(sector1)
)
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Testing

Run the prettifier tests:
```bash
npx tsx src/tests/testPrettifier.ts
```

### Project Structure

```
src/
├── services/
│   ├── Prettifier.ts    # Main prettification logic
│   └── Compressor.ts    # Code compression logic
├── tests/
│   ├── testPrettifier.ts      # Test runner
│   └── testExpressions.txt    # Test cases
├── App.tsx              # Main React component
├── main.tsx            # Application entry point
├── App.css             # Styling
└── assets/
    └── custom_highlights.css  # Syntax highlighting styles
```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Code Editor**: @uiw/react-textarea-code-editor
- **Styling**: CSS
- **Linting**: ESLint

## Architecture

### Prettifier Service
The `Prettifier` class uses a stack-based parser to process Drapo code:
- Tokenizes input into meaningful elements
- Manages indentation levels
- Handles different statement types (IF, Execute, etc.)
- Maintains proper formatting rules

### Compressor Service  
The `Compressor` class provides the inverse operation:
- Removes unnecessary whitespace
- Compacts operators and expressions
- Maintains code functionality while reducing size

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes using the test suite
5. Submit a pull request

## License

This project is open source. Please check the repository for license information.
