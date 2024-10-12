type StackContent = (PrettifierStep | (()=>void));
enum PrettifierStep 
{
    DumpOutputLine,
    IncOutputIdentation,
    DecOutputIdentation,
    Spaces,
    Block,
    FunctionCall,
    VariableName,
    Mustache,
    OpenParentheses,
    CloseParentheses,
    Parameter,
    Expression,
    Comma,
    GeneralTextParameter,
}

export class Prettifier 
{
    private readonly VARIABLE = new Set("_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.");

    private input : string = "";
    private parserPosition: number = 0;
    private stepStack : StackContent[] = [PrettifierStep.Spaces, PrettifierStep.Block, PrettifierStep.Spaces];

    private output : string = "";
    private inputLineStartMarker : number = 0;
    private outputIdentation : number = 0;

    private lastVariableName : string = "";

    public parse(input : string) : string 
    {
        this.input = input;
        this.parserPosition = 0;
        this.stepStack = [PrettifierStep.Spaces, PrettifierStep.Block, PrettifierStep.Spaces];
        this.output = "";
        this.inputLineStartMarker = 0;
        this.outputIdentation = 0;

        while (this.parserPosition < this.input.length && this.stepStack.length > 0)
        {
            const nextStep = this.stepStack[this.stepStack.length-1];
            if ((typeof nextStep) === 'function')
            {
                (nextStep as (()=>void))();
                continue;
            }
            switch (nextStep)
            {
                case PrettifierStep.DumpOutputLine:
                    this.dumpOutputLineStep();
                    break;
                case PrettifierStep.IncOutputIdentation:
                    this.outputIdentation++;
                    this.stepStack.pop();
                    break;
                case PrettifierStep.DecOutputIdentation:
                    this.outputIdentation--;
                    this.stepStack.pop();
                    break;
                case PrettifierStep.Spaces:
                    this.spaceStep();
                    break;
                case PrettifierStep.Block:
                    this.blockStep();
                    break;
                case PrettifierStep.FunctionCall:
                    this.functionCallStep();
                    break;
                case PrettifierStep.VariableName:
                    this.variableNameStep();
                    break;
                case PrettifierStep.Mustache:
                    this.mustacheStep();
                    break;
                case PrettifierStep.OpenParentheses:
                    this.jumpChar("(");
                    this.stepStack.pop();
                    break;
                case PrettifierStep.CloseParentheses:
                    this.jumpChar(")");
                    this.stepStack.pop();
                    break;
                case PrettifierStep.Parameter:
                    this.parameterStep();
                    break;
                case PrettifierStep.Expression:
                    this.expressionStep();
                    break;
                case PrettifierStep.Comma:
                    this.jumpChar(",");
                    this.stepStack.pop();
                    break;
                case PrettifierStep.GeneralTextParameter:
                    this.generalTextParameterStep();
                    break;
                default:
                    break;
            }
        }
        this.dumpOutputLineStep();
        return this.output;
    }

    private parserError(message: string)
    {
        throw "Parser error: " + message + "\n" +
            "Current char: " + this.input[this.parserPosition] + "\n" +
            "Parsed data: " + this.input.slice(0, this.parserPosition+1);
    }

    private dumpOutputLineStep()
    {
        this.stepStack.pop();
        this.output +=  "\t".repeat(this.outputIdentation) + this.input.slice(this.inputLineStartMarker, this.parserPosition).trim() + "\n";
        this.inputLineStartMarker = this.parserPosition;
    }

    private spaceStep() 
    {
        const nextChar = this.input[this.parserPosition];
        if (nextChar == " " || nextChar == "\n" || nextChar == "\t")
            this.parserPosition++;
        else
            this.stepStack.pop();
    }

    private blockStep()
    {
        const nextChar = this.input[this.parserPosition];
        if (nextChar == ";")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.DumpOutputLine, PrettifierStep.Spaces);
        }
        else if (nextChar == "{")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Mustache);
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.VariableName);
        else if (nextChar == ")" || nextChar == ",")
            this.stepStack.pop();
        else
            this.parserError("parsing code block");
    }

    private functionCallStep() 
    {
        this.stepStack.pop();
        const nextChar = this.input[this.parserPosition];
        if (nextChar != "(")
            return;
        if (this.lastVariableName.toLowerCase() == "if")
        {
            this.stepStack.push(
                PrettifierStep.CloseParentheses,
                PrettifierStep.DecOutputIdentation,
                PrettifierStep.DumpOutputLine,
                () => this.optionalParameter(true, [PrettifierStep.Block]),
                () => this.optionalParameter(true, [PrettifierStep.Block]),
                PrettifierStep.Spaces,
                PrettifierStep.Expression,
                PrettifierStep.IncOutputIdentation,
                PrettifierStep.DumpOutputLine,
                PrettifierStep.Spaces,
                PrettifierStep.OpenParentheses, 
            );
        }
        else if (this.lastVariableName.toLowerCase() == "executedataitem")
        {
            this.stepStack.push(
                PrettifierStep.CloseParentheses,
                PrettifierStep.DecOutputIdentation,
                PrettifierStep.DumpOutputLine,
                () => this.optionalParameter(true, [PrettifierStep.GeneralTextParameter]),
                PrettifierStep.Spaces,
                () => this.optionalParameter(true, [PrettifierStep.Expression]),
                PrettifierStep.Spaces,
                () => this.optionalParameter(true, [PrettifierStep.Expression]),
                PrettifierStep.GeneralTextParameter,
                PrettifierStep.DumpOutputLine,
                PrettifierStep.Spaces,
                PrettifierStep.Comma,
                PrettifierStep.DumpOutputLine,
                PrettifierStep.Spaces,
                PrettifierStep.Block,
                PrettifierStep.IncOutputIdentation,
                PrettifierStep.DumpOutputLine,
                PrettifierStep.Spaces,
                PrettifierStep.OpenParentheses, 
            );
        }
        else if (this.lastVariableName.toLowerCase() == "acceptdatachanges")
        {
            this.stepStack.push(
                PrettifierStep.CloseParentheses,
                PrettifierStep.Spaces,
                PrettifierStep.Parameter,
                PrettifierStep.Spaces,
                PrettifierStep.GeneralTextParameter,
                PrettifierStep.Spaces,
                PrettifierStep.OpenParentheses, 
            );
        }
        else if (this.lastVariableName.length > 0)
        {
            this.stepStack.push(
                PrettifierStep.Spaces, 
                PrettifierStep.CloseParentheses, 
                PrettifierStep.Spaces, 
                PrettifierStep.Parameter, 
                PrettifierStep.Spaces,
                PrettifierStep.OpenParentheses, 
            );
        }
    }

    private optionalParameter(startNewLine: boolean, steps: StackContent[])
    {
        this.stepStack.pop();
        const nextChar = this.input[this.parserPosition];
        if (nextChar == ",")
        {
            this.stepStack.push(
                PrettifierStep.Spaces,
                ...steps,
                startNewLine ? PrettifierStep.DumpOutputLine : PrettifierStep.Spaces,
                PrettifierStep.Spaces,
                PrettifierStep.Comma,
                startNewLine ? PrettifierStep.DumpOutputLine : PrettifierStep.Spaces,
            );
        }
    }

    private generalTextParameterStep()
    {
        this.stepStack.pop();
        let nextChar = this.input[this.parserPosition];
        while(this.parserPosition < this.input.length && nextChar != "," && nextChar != ")")
            nextChar = this.input[++this.parserPosition];
    }

    private variableNameStep() 
    {
        this.stepStack.pop();
        this.lastVariableName = "";
        let nextChar = this.input[this.parserPosition];
        while (this.parserPosition < this.input.length && this.VARIABLE.has(nextChar))
        {
            this.lastVariableName += nextChar;
            nextChar = this.input[++this.parserPosition];
        }
        this.stepStack.push(PrettifierStep.FunctionCall, PrettifierStep.Spaces);
    }

    private mustacheStep() 
    {
        if (this.input[this.parserPosition] == "{")
        {
            let nextChar2 = this.input.slice(this.parserPosition, this.parserPosition+2);
            while ((nextChar2 != "}}") && (this.parserPosition < this.input.length))
            {
                this.parserPosition++;
                nextChar2 = this.input.slice(this.parserPosition, this.parserPosition+2);
            }
            this.parserPosition += 2;
        }
        this.stepStack.pop();
    }

    private jumpChar(char: string)
    {
        if (this.input[this.parserPosition] != char)
            this.parserError(`expecting char '${char}'`);
        this.parserPosition++;
    }

    private parameterStep()
    {
        const nextChar = this.input[this.parserPosition];
        if (nextChar == "(" || nextChar == "{" || nextChar == "!")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Expression);
        else if (nextChar == ",")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.VariableName)
        else if (nextChar == ")")
            this.stepStack.pop();
        else
            this.parserError("parsing parameter");
    }

    private expressionStep()
    {
        const nextChar = this.input[this.parserPosition];
        const nextChar2 = nextChar + this.input[this.parserPosition+1];
        if (nextChar == "(")
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.CloseParentheses, PrettifierStep.Spaces, PrettifierStep.Expression, PrettifierStep.Spaces, PrettifierStep.OpenParentheses);
        else if (nextChar2 == "&&" || nextChar2 == "||")
        {
            this.wrapSimbolInSpaces(2);
            this.stepStack.push(PrettifierStep.Spaces);
        }
        else if (nextChar2 == "!=" || nextChar2 == "<=" || nextChar2 == ">=")
        {
            this.wrapSimbolInSpaces(2);
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.VariableName, PrettifierStep.Spaces);
        }
        else if (nextChar == "=" || nextChar == ">" || nextChar == "<")
        {
            this.wrapSimbolInSpaces(1);
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.VariableName, PrettifierStep.Spaces);
        }
        else if (nextChar == "!")
        {
            this.parserPosition++;
            this.stepStack.push(PrettifierStep.Mustache, PrettifierStep.Spaces);
        }
        else if (nextChar == "{")
        {
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.Mustache);
        }
        else if (this.VARIABLE.has(nextChar))
            this.stepStack.push(PrettifierStep.Spaces, PrettifierStep.VariableName)
        else
            this.stepStack.pop();
    }

    private wrapSimbolInSpaces(simbolLength: number)
    {
        let replaceSimbol = this.input.slice(this.parserPosition, this.parserPosition + simbolLength);
        if (this.input[this.parserPosition-1] != " ")
            replaceSimbol = " " + replaceSimbol;
        if (this.input[this.parserPosition + simbolLength] != " ")
            replaceSimbol += " ";
        this.input = this.input.slice(0, this.parserPosition) + replaceSimbol + this.input.slice(this.parserPosition + simbolLength);
        this.parserPosition += replaceSimbol.length;
    }

}
